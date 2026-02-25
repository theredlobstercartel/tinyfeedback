import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/webhooks - List webhooks for the authenticated user's projects
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project_id from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    // Build query
    let query = supabase
      .from('webhooks')
      .select(`
        *,
        bmad_projects!inner(user_id)
      `)
      .eq('bmad_projects.user_id', user.id);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: webhooks, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    // Remove the nested project data from response
    const sanitizedWebhooks = webhooks?.map(webhook => ({
      id: webhook.id,
      project_id: webhook.project_id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      is_active: webhook.is_active,
      created_at: webhook.created_at,
      updated_at: webhook.updated_at,
    })) || [];

    return NextResponse.json({ webhooks: sanitizedWebhooks });
  } catch (error) {
    console.error('Error in GET /api/webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, name, url, events } = body;

    // Validate required fields
    if (!project_id || !name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: project_id, name, url, events' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Validate events
    const validEvents = ['feedback.created', 'feedback.updated'];
    const invalidEvents = events.filter(e => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('bmad_projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 });
    }

    // Generate a random secret for HMAC signature
    const secret = generateWebhookSecret();

    // Create webhook
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        project_id,
        name,
        url,
        secret,
        events,
        is_active: true,
      })
      .select('id, project_id, name, url, events, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/webhooks:', error);
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
