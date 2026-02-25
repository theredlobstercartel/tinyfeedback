import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Webhook payload interface
interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// Webhook delivery log interface
interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: WebhookPayload;
  status: 'pending' | 'delivered' | 'failed';
  signature: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at?: string;
}

// Webhook configuration interface
interface Webhook {
  id: string;
  project_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(secret: string, payload: string): string {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  // Use Web Crypto API for HMAC-SHA256
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, messageData)
  ).then(signature => {
    // Convert ArrayBuffer to hex string
    const array = new Uint8Array(signature);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  });
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
 * Get Slack-compatible payload template
 */
function getSlackTemplate(event: string, data: Record<string, unknown>): Record<string, unknown> {
  const feedbackType = data.type as string;
  const npsScore = data.nps_score as number | null;
  const content = data.content as string;
  const pageUrl = data.page_url as string;
  const userEmail = data.user_email as string;
  
  const typeLabels: Record<string, string> = {
    nps: '⭐ NPS Score',
    suggestion: '💡 Sugestão',
    bug: '🐛 Bug Report',
  };
  
  const typeColors: Record<string, string> = {
    nps: '#00ff88',
    suggestion: '#4488ff',
    bug: '#ff4444',
  };

  const eventLabels: Record<string, string> = {
    'feedback.created': '🆕 Novo Feedback',
    'feedback.updated': '📝 Feedback Atualizado',
  };

  const fields: Array<{ title: string; value: string; short: boolean }> = [
    {
      title: 'Tipo',
      value: typeLabels[feedbackType] || feedbackType,
      short: true,
    },
    {
      title: 'Status',
      value: eventLabels[event] || event,
      short: true,
    },
  ];

  if (npsScore !== null && npsScore !== undefined) {
    fields.push({
      title: 'NPS Score',
      value: `${npsScore}/10`,
      short: true,
    });
  }

  if (pageUrl) {
    fields.push({
      title: 'Página',
      value: pageUrl,
      short: false,
    });
  }

  if (userEmail) {
    fields.push({
      title: 'Usuário',
      value: userEmail,
      short: false,
    });
  }

  return {
    attachments: [
      {
        color: typeColors[feedbackType] || '#888888',
        title: eventLabels[event] || event,
        text: content?.length > 200 ? `${content.substring(0, 200)}...` : content,
        fields,
        footer: 'TinyFeedback',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Get Discord-compatible payload template
 */
function getDiscordTemplate(event: string, data: Record<string, unknown>): Record<string, unknown> {
  const feedbackType = data.type as string;
  const npsScore = data.nps_score as number | null;
  const content = data.content as string;
  const pageUrl = data.page_url as string;
  const userEmail = data.user_email as string;
  const projectName = data.project_name as string;
  const feedbackId = data.id as string;
  
  const typeLabels: Record<string, string> = {
    nps: '⭐ NPS Score',
    suggestion: '💡 Sugestão',
    bug: '🐛 Bug Report',
  };
  
  const typeColors: Record<string, number> = {
    nps: 0x00ff88,
    suggestion: 0x4488ff,
    bug: 0xff4444,
  };

  const eventLabels: Record<string, string> = {
    'feedback.created': '🆕 Novo Feedback',
    'feedback.updated': '📝 Feedback Atualizado',
  };

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    {
      name: 'Tipo',
      value: typeLabels[feedbackType] || feedbackType,
      inline: true,
    },
    {
      name: 'Projeto',
      value: projectName || 'N/A',
      inline: true,
    },
  ];

  if (npsScore !== null && npsScore !== undefined) {
    fields.push({
      name: 'NPS Score',
      value: `${npsScore}/10`,
      inline: true,
    });
  }

  if (pageUrl) {
    fields.push({
      name: 'Página',
      value: pageUrl,
      inline: false,
    });
  }

  if (userEmail) {
    fields.push({
      name: 'Usuário',
      value: userEmail,
      inline: false,
    });
  }

  return {
    embeds: [
      {
        title: eventLabels[event] || event,
        description: content?.length > 500 ? `${content.substring(0, 500)}...` : content,
        color: typeColors[feedbackType] || 0x888888,
        fields,
        footer: {
          text: `TinyFeedback • ID: ${feedbackId?.substring(0, 8)}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Detect if URL is for Slack, Discord, or generic webhook
 */
function detectWebhookType(url: string): 'slack' | 'discord' | 'generic' {
  if (url.includes('hooks.slack.com')) {
    return 'slack';
  }
  if (url.includes('discord.com/api/webhooks') || url.includes('discordapp.com/api/webhooks')) {
    return 'discord';
  }
  return 'generic';
}

/**
 * Process a single webhook delivery
 */
async function processWebhookDelivery(
  webhook: Webhook,
  event: string,
  data: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const webhookType = detectWebhookType(webhook.url);
  
  // Build payload based on webhook type
  let payload: WebhookPayload;
  let body: string;
  
  if (webhookType === 'slack') {
    const slackPayload = getSlackTemplate(event, data);
    body = JSON.stringify(slackPayload);
    payload = {
      event,
      timestamp: new Date().toISOString(),
      data: slackPayload,
    };
  } else if (webhookType === 'discord') {
    const discordPayload = getDiscordTemplate(event, data);
    body = JSON.stringify(discordPayload);
    payload = {
      event,
      timestamp: new Date().toISOString(),
      data: discordPayload,
    };
  } else {
    // Generic webhook - send standard payload
    payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    body = JSON.stringify(payload);
  }

  // Generate HMAC signature
  const signature = await generateSignature(webhook.secret, body);

  // Create delivery log entry
  const { data: logEntry, error: logError } = await supabase
    .from('webhook_delivery_logs')
    .insert({
      webhook_id: webhook.id,
      event_type: event,
      payload,
      status: 'pending',
      signature,
      attempt_count: 1,
      max_attempts: 5,
    })
    .select()
    .single();

  if (logError || !logEntry) {
    console.error('Error creating delivery log:', logError);
    throw new Error('Failed to create delivery log');
  }

  // Send the webhook
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': event,
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
        })
        .eq('id', logEntry.id);

      console.log(`Webhook ${webhook.id} delivered successfully`);
    } else {
      // Failed - schedule retry
      const nextRetryAt = new Date(Date.now() + calculateBackoffDelay(1));
      
      await supabase
        .from('webhook_delivery_logs')
        .update({
          status: 'pending',
          http_status_code: response.status,
          response_body: responseBody,
          next_retry_at: nextRetryAt.toISOString(),
        })
        .eq('id', logEntry.id);

      console.log(`Webhook ${webhook.id} failed with status ${response.status}, scheduled retry`);
    }
  } catch (error) {
    // Network error - schedule retry
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const nextRetryAt = new Date(Date.now() + calculateBackoffDelay(1));
    
    await supabase
      .from('webhook_delivery_logs')
      .update({
        status: 'pending',
        error_message: errorMessage,
        next_retry_at: nextRetryAt.toISOString(),
      })
      .eq('id', logEntry.id);

    console.log(`Webhook ${webhook.id} failed with error, scheduled retry:`, errorMessage);
  }
}

/**
 * Main handler for processing webhook events
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

    // Get the event data from request body
    const body = await req.json();
    const { event, project_id, data } = body as { event: string; project_id: string; data: Record<string, unknown> };

    if (!event || !project_id || !data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event, project_id, data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing webhook event: ${event} for project: ${project_id}`);

    // Fetch all active webhooks for this project that subscribe to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('project_id', project_id)
      .eq('is_active', true)
      .contains('events', [event]);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      throw new Error('Failed to fetch webhooks');
    }

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for this event');
      return new Response(
        JSON.stringify({ success: true, message: 'No webhooks to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${webhooks.length} webhooks to process`);

    // Process each webhook
    const results = await Promise.allSettled(
      webhooks.map(webhook => processWebhookDelivery(webhook, event, data, supabase))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${webhooks.length} webhooks`,
        success_count: successCount,
        failure_count: failureCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in process-webhook function:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
