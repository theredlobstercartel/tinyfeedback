import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/webhooks/[id]/logs - Get delivery logs for a webhook
export async function GET(
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // First, verify the webhook belongs to the user
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select(`
        id,
        bmad_projects!inner(user_id)
      `)
      .eq('id', id)
      .eq('bmad_projects.user_id', user.id)
      .single();

    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Fetch delivery logs
    let query = supabase
      .from('webhook_delivery_logs')
      .select(`
        id,
        webhook_id,
        event_type,
        status,
        http_status_code,
        error_message,
        attempt_count,
        max_attempts,
        delivered_at,
        created_at
      `)
      .eq('webhook_id', id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching webhook logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('webhook_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('webhook_id', id);

    if (countError) {
      console.error('Error counting logs:', countError);
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/webhooks/[id]/logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
