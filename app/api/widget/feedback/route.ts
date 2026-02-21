import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  getClientIP, 
  checkRateLimit, 
  getRateLimitHeaders, 
  getRateLimitErrorMessage 
} from '@/lib/rate-limit';

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

    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: getRateLimitErrorMessage(rateLimitResult.retryAfter || 60) },
        { 
          status: 429, 
          headers: { ...corsHeaders, ...rateLimitHeaders }
        }
      );
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

    // For suggestion type, title is required (ST-07)
    if (type === 'suggestion' && !title) {
      return NextResponse.json(
        { error: 'Title is required for suggestions' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key matches project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, api_key, allowed_domains, feedbacks_count, max_feedbacks')
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

    // Check feedback quota
    if (project.feedbacks_count >= project.max_feedbacks) {
      return NextResponse.json(
        { error: 'Feedback quota exceeded for this project' },
        { status: 429, headers: corsHeaders }
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
        content: content || 'No description provided',
        title: title || null,
        page_url: page_url || null,
        user_agent: user_agent || request.headers.get('user-agent') || null,
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

    // Increment project feedback count
    await supabase
      .from('projects')
      .update({ feedbacks_count: (project.feedbacks_count || 0) + 1 })
      .eq('id', project_id);

    return NextResponse.json(
      { success: true, data: feedback },
      { status: 201, headers: { ...corsHeaders, ...rateLimitHeaders } }
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
