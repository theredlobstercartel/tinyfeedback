import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Webhook delivery log interface
interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
  };
  status: 'pending' | 'delivered' | 'failed';
  signature: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string | null;
  error_message: string | null;
}

// Webhook configuration interface
interface Webhook {
  id: string;
  project_id: string;
  url: string;
  secret: string;
  is_active: boolean;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
async function generateSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convert ArrayBuffer to hex string
  const array = new Uint8Array(signature);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate exponential backoff delay
 * Base delay: 5 seconds, doubles with each retry
 */
function calculateBackoffDelay(attemptCount: number): number {
  const baseDelay = 5000; // 5 seconds
  const maxDelay = 3600000; // 1 hour
  const delay = baseDelay * Math.pow(2, attemptCount - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retry a single webhook delivery
 */
async function retryWebhookDelivery(
  logEntry: WebhookDeliveryLog,
  webhook: Webhook,
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; error?: string }> {
  const body = JSON.stringify(logEntry.payload);

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${logEntry.signature}`,
        'X-Webhook-Event': logEntry.event_type,
        'X-Webhook-ID': webhook.id,
        'User-Agent': 'TinyFeedback-Webhook/1.0',
      },
      body,
    });

    const responseBody = await response.text();

    if (response.ok) {
      // Success - update log entry
      await supabase
        .from('webhook_delivery_logs')
        .update({
          status: 'delivered',
          http_status_code: response.status,
          response_body: responseBody,
          delivered_at: new Date().toISOString(),
          attempt_count: logEntry.attempt_count + 1,
          error_message: null,
          next_retry_at: null,
        })
        .eq('id', logEntry.id);

      console.log(`Webhook retry ${logEntry.id} delivered successfully`);
      return { success: true };
    } else {
      // Failed again - schedule another retry if under max attempts
      const newAttemptCount = logEntry.attempt_count + 1;
      
      if (newAttemptCount >= logEntry.max_attempts) {
        // Max retries reached - mark as failed
        await supabase
          .from('webhook_delivery_logs')
          .update({
            status: 'failed',
            http_status_code: response.status,
            response_body: responseBody,
            attempt_count: newAttemptCount,
            next_retry_at: null,
          })
          .eq('id', logEntry.id);

        console.log(`Webhook ${logEntry.id} failed after ${newAttemptCount} attempts`);
        return { success: false, error: `Failed after ${newAttemptCount} attempts with status ${response.status}` };
      } else {
        // Schedule another retry
        const nextRetryAt = new Date(Date.now() + calculateBackoffDelay(newAttemptCount));
        
        await supabase
          .from('webhook_delivery_logs')
          .update({
            http_status_code: response.status,
            response_body: responseBody,
            attempt_count: newAttemptCount,
            next_retry_at: nextRetryAt.toISOString(),
          })
          .eq('id', logEntry.id);

        console.log(`Webhook ${logEntry.id} failed with status ${response.status}, scheduled retry ${newAttemptCount}`);
        return { success: false, error: `Retry ${newAttemptCount} scheduled` };
      }
    }
  } catch (error) {
    // Network error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const newAttemptCount = logEntry.attempt_count + 1;
    
    if (newAttemptCount >= logEntry.max_attempts) {
      // Max retries reached - mark as failed
      await supabase
        .from('webhook_delivery_logs')
        .update({
          status: 'failed',
          attempt_count: newAttemptCount,
          error_message: errorMessage,
          next_retry_at: null,
        })
        .eq('id', logEntry.id);

      console.log(`Webhook ${logEntry.id} failed after ${newAttemptCount} attempts: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } else {
      // Schedule another retry
      const nextRetryAt = new Date(Date.now() + calculateBackoffDelay(newAttemptCount));
      
      await supabase
        .from('webhook_delivery_logs')
        .update({
          attempt_count: newAttemptCount,
          error_message: errorMessage,
          next_retry_at: nextRetryAt.toISOString(),
        })
        .eq('id', logEntry.id);

      console.log(`Webhook ${logEntry.id} failed, scheduled retry ${newAttemptCount}: ${errorMessage}`);
      return { success: false, error: `Retry ${newAttemptCount} scheduled` };
    }
  }
}

/**
 * Main handler for retrying pending webhooks
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const now = new Date().toISOString();

    // Fetch all pending webhook deliveries that are due for retry
    const { data: pendingLogs, error: logsError } = await supabase
      .from('webhook_delivery_logs')
      .select(`
        id,
        webhook_id,
        event_type,
        payload,
        status,
        signature,
        attempt_count,
        max_attempts,
        next_retry_at,
        error_message
      `)
      .eq('status', 'pending')
      .lte('next_retry_at', now)
      .order('next_retry_at', { ascending: true })
      .limit(100);

    if (logsError) {
      console.error('Error fetching pending logs:', logsError);
      throw new Error('Failed to fetch pending logs');
    }

    if (!pendingLogs || pendingLogs.length === 0) {
      console.log('No pending webhooks to retry');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending webhooks to retry', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingLogs.length} pending webhooks to retry`);

    // Group by webhook_id to fetch webhooks efficiently
    const webhookIds = [...new Set(pendingLogs.map(log => log.webhook_id))];
    
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('id, project_id, url, secret, is_active')
      .in('id', webhookIds);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      throw new Error('Failed to fetch webhooks');
    }

    const webhookMap = new Map(webhooks?.map(w => [w.id, w]) || []);

    // Process each pending log
    const results = await Promise.allSettled(
      pendingLogs.map(async (log) => {
        const webhook = webhookMap.get(log.webhook_id);
        
        if (!webhook) {
          console.error(`Webhook ${log.webhook_id} not found`);
          // Mark as failed since webhook doesn't exist
          await supabase
            .from('webhook_delivery_logs')
            .update({ status: 'failed', error_message: 'Webhook configuration not found' })
            .eq('id', log.id);
          return { logId: log.id, success: false, error: 'Webhook not found' };
        }

        if (!webhook.is_active) {
          console.log(`Webhook ${webhook.id} is inactive, skipping`);
          // Mark as failed since webhook is inactive
          await supabase
            .from('webhook_delivery_logs')
            .update({ status: 'failed', error_message: 'Webhook is inactive' })
            .eq('id', log.id);
          return { logId: log.id, success: false, error: 'Webhook is inactive' };
        }

        const result = await retryWebhookDelivery(log, webhook, supabase);
        return { logId: log.id, ...result };
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
    const failureCount = results.filter(r => r.status === 'rejected' || !(r.value as { success: boolean }).success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${pendingLogs.length} pending webhooks`,
        processed: pendingLogs.length,
        success_count: successCount,
        failure_count: failureCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in retry-webhooks function:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
