import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CORS headers for widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

/**
 * POST /api/widget/feedback
 * Create new feedback from widget
 * Requires X-API-Key header for project authentication
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Handle preflight CORS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    // Get API key from header
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is required' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      project_id, 
      type, 
      nps_score, 
      content,
      page_url,
      user_agent,
      user_email,
      user_id,
      screenshot_url,
      title
    } = body;

    // Validate required fields
    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!type || !['nps', 'suggestion', 'bug'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be one of: nps, suggestion, bug' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key matches project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, api_key, allowed_domains')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (project.api_key !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API Key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate domain if allowed_domains is set
    if (project.allowed_domains?.length > 0) {
      const origin = request.headers.get('origin') || '';
      const referer = request.headers.get('referer') || '';
      const requestUrl = origin || referer;
      
      const isAllowed = project.allowed_domains.some((domain: string) => {
        if (!requestUrl) return false;
        try {
          const url = new URL(requestUrl);
          return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
        } catch {
          return requestUrl.includes(domain);
        }
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Domain not authorized' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('feedbacks')
      .insert({
        project_id,
        type,
        nps_score: nps_score ?? null,
        content: content || '',
        title: title || null,
        page_url: page_url || null,
        user_agent: user_agent || null,
        user_email: user_email || null,
        user_id: user_id || null,
        screenshot_url: screenshot_url || null,
        status: 'new',
        response_sent: false,
        internal_notes: null,
        response_content: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, data: feedback },
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/widget/feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { 
    status: 204,
    headers: corsHeaders 
  });
}
