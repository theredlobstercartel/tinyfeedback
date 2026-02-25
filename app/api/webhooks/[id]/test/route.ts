import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/webhooks/[id]/test - Send a test webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Fetch webhook with project verification
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select(`
        *,
        bmad_projects!inner(user_id, name)
      `)
      .eq('id', id)
      .eq('bmad_projects.user_id', user.id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Create test payload
    const testPayload = {
      event: 'feedback.created',
      timestamp: new Date().toISOString(),
      data: {
        id: 'test-feedback-id',
        project_id: webhook.project_id,
        project_name: webhook.bmad_projects?.name || 'Test Project',
        type: 'suggestion',
        nps_score: null,
        title: 'Test Feedback',
        content: 'This is a test webhook payload from TinyFeedback.',
        screenshot_url: null,
        user_email: 'test@example.com',
        user_id: null,
        page_url: 'https://example.com/test',
        user_agent: 'TinyFeedback Test/1.0',
        status: 'pending',
        workflow_status: 'new',
        internal_notes: null,
        response_sent: false,
        response_content: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    // Send test webhook
    const startTime = Date.now();
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'feedback.created',
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Test': 'true',
          'User-Agent': 'TinyFeedback-Webhook/1.0',
        },
        body: JSON.stringify(testPayload),
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      return NextResponse.json({
        success: response.ok,
        status_code: response.status,
        response_time_ms: responseTime,
        response_body: responseBody.substring(0, 1000), // Limit response size
        test_payload: testPayload,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response_time_ms: responseTime,
        test_payload: testPayload,
      }, { status: 502 });
    }
  } catch (error) {
    console.error('Error in POST /api/webhooks/[id]/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/webhooks/[id]/regenerate-secret - Regenerate webhook secret
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Generate new secret
    const newSecret = generateWebhookSecret();

    // Update webhook with ownership verification
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .update({
        secret: newSecret,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .filter('bmad_projects.user_id', 'eq', user.id)
      .select(`
        id,
        project_id,
        name,
        url,
        events,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
      }
      console.error('Error regenerating webhook secret:', error);
      return NextResponse.json({ error: 'Failed to regenerate secret' }, { status: 500 });
    }

    return NextResponse.json({
      webhook,
      secret: newSecret,
      message: 'Secret regenerated successfully. Save this secret - it will not be shown again.',
    });
  } catch (error) {
    console.error('Error in PATCH /api/webhooks/[id]/regenerate-secret:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate a random webhook secret
function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `whsec_${result}`;
}
