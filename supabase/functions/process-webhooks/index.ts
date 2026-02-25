/**
 * Supabase Edge Function: Process Webhooks
 * ST-11: Webhooks e Integrações
 * 
 * This function processes pending webhook deliveries, sends HTTP requests,
 * handles retries with exponential backoff, and logs results.
 * 
 * Deploy with: supabase functions deploy process-webhooks
 * Schedule with: supabase functions schedule process-webhooks --cron '*/1 * * * *'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { crypto } from 'https://deno.land/std@0.207.0/crypto/mod.ts'

// Configuration
const WEBHOOK_TIMEOUT_MS = 30000 // 30 seconds
const MAX_BATCH_SIZE = 100

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookDelivery {
  delivery_id: string
  webhook_id: string
  project_id: string
  url: string
  secret: string
  event_type: string
  payload: Record<string, unknown>
  headers: Record<string, string>
  attempt_number: number
  max_retries: number
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
async function signPayload(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(payload))
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Send a webhook HTTP request
 */
async function sendWebhook(
  delivery: WebhookDelivery
): Promise<{
  success: boolean
  statusCode?: number
  responseBody?: string
  responseHeaders?: Record<string, string>
  error?: string
  durationMs: number
}> {
  const startTime = Date.now()

  try {
    // Generate signature
    const signature = await signPayload(delivery.payload, delivery.secret)

    // Build headers with signature
    const headers: Record<string, string> = {
      ...delivery.headers,
      'X-Webhook-Signature': signature,
    }

    // Send request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

    const response = await fetch(delivery.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(delivery.payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const durationMs = Date.now() - startTime
    const responseBody = await response.text()

    // Parse response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Success is 2xx status code
    const success = response.status >= 200 && response.status < 300

    return {
      success,
      statusCode: response.status,
      responseBody: responseBody.slice(0, 10000), // Limit size
      responseHeaders,
      durationMs,
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    let errorMessage = 'Unknown error'

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage,
      durationMs,
    }
  }
}

/**
 * Main handler for the edge function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get pending webhook deliveries
    const { data: deliveries, error: fetchError } = await supabase.rpc(
      'get_pending_webhook_deliveries',
      { p_limit: MAX_BATCH_SIZE }
    )

    if (fetchError) {
      console.error('Error fetching pending deliveries:', fetchError)
      throw fetchError
    }

    if (!deliveries || deliveries.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending webhooks to process', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Process each delivery
    const results = await Promise.all(
      deliveries.map(async (delivery: WebhookDelivery) => {
        console.log(`Processing webhook ${delivery.delivery_id} (attempt ${delivery.attempt_number})`)

        // Send the webhook
        const result = await sendWebhook(delivery)

        // Determine new status
        let newStatus: string
        if (result.success) {
          newStatus = 'delivered'
        } else if (delivery.attempt_number >= delivery.max_retries) {
          newStatus = 'failed'
        } else {
          newStatus = 'retrying'
        }

        // Update delivery status in database
        const { error: updateError } = await supabase.rpc(
          'update_webhook_delivery_status',
          {
            p_delivery_id: delivery.delivery_id,
            p_status: newStatus,
            p_http_status_code: result.statusCode || null,
            p_response_body: result.responseBody || null,
            p_response_headers: result.responseHeaders || null,
            p_error_message: result.error || null,
            p_duration_ms: result.durationMs,
          }
        )

        if (updateError) {
          console.error(`Error updating delivery ${delivery.delivery_id}:`, updateError)
        }

        return {
          delivery_id: delivery.delivery_id,
          status: newStatus,
          success: result.success,
          duration_ms: result.durationMs,
        }
      })
    )

    // Return summary
    const summary = {
      processed: results.length,
      delivered: results.filter(r => r.status === 'delivered').length,
      failed: results.filter(r => r.status === 'failed').length,
      retrying: results.filter(r => r.status === 'retrying').length,
      avg_duration_ms: Math.round(
        results.reduce((acc, r) => acc + r.duration_ms, 0) / results.length
      ),
    }

    console.log('Webhook processing completed:', summary)

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in process-webhooks function:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
