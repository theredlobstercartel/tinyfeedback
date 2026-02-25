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

// Free plan limits
const FREE_PLAN_LIMIT = 100;
const WARNING_THRESHOLD = 80;

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
      attachment_urls,
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

    // For bug type, title is also recommended
    if (type === 'bug' && !title) {
      return NextResponse.json(
        { error: 'Title is required for bug reports' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate attachment_urls if provided
    let validatedAttachmentUrls: string[] | null = null;
    if (attachment_urls && Array.isArray(attachment_urls) && attachment_urls.length > 0) {
      // Validate URLs (basic validation)
      validatedAttachmentUrls = attachment_urls.filter(url => 
        typeof url === 'string' && 
        (url.startsWith('http://') || url.startsWith('https://'))
      );
      
      // Limit to max 5 attachments
      if (validatedAttachmentUrls.length > 5) {
        validatedAttachmentUrls = validatedAttachmentUrls.slice(0, 5);
      }
    }

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key matches project
    const { data: project, error: projectError } = await supabase
      .from('bmad_projects')
      .select('id, api_key, allowed_domains, feedbacks_count, max_feedbacks, monthly_feedbacks_count, monthly_feedbacks_reset_at, plan, subscription_status')
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

    // Check if project is on Free plan
    const isPro = project.plan === 'pro' && project.subscription_status === 'active';
    
    if (!isPro) {
      // Reset monthly counter if it's a new month
      let monthlyCount = project.monthly_feedbacks_count || 0;
      const lastReset = project.monthly_feedbacks_reset_at;
      const now = new Date();
      
      // Check if we need to reset (new month)
      if (lastReset) {
        const lastResetDate = new Date(lastReset);
        const isNewMonth = lastResetDate.getMonth() !== now.getMonth() || 
                          lastResetDate.getFullYear() !== now.getFullYear();
        
        if (isNewMonth) {
          monthlyCount = 0;
        }
      }

      // AC-03: Block feedback if limit reached
      if (monthlyCount >= FREE_PLAN_LIMIT) {
        return NextResponse.json(
          { 
            error: 'LIMIT_REACHED',
            message: 'Este projeto atingiu o limite de 100 feedbacks este mês. Faça upgrade para o plano Pro para continuar recebendo feedbacks.',
            upgrade_url: '/billing',
            current_count: monthlyCount,
            limit: FREE_PLAN_LIMIT
          },
          { status: 429, headers: corsHeaders }
        );
      }

      // AC-02: Check if approaching limit (80+ feedbacks)
      const isWarning = monthlyCount >= WARNING_THRESHOLD;

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
          attachment_urls: validatedAttachmentUrls,
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

      // Increment counters
      const newMonthlyCount = monthlyCount + 1;
      await supabase
        .from('bmad_projects')
        .update({ 
          feedbacks_count: (project.feedbacks_count || 0) + 1,
          monthly_feedbacks_count: newMonthlyCount,
          monthly_feedbacks_reset_at: now.toISOString()
        })
        .eq('id', project_id);

      // Build response with warning if approaching limit
      const responseData: Record<string, unknown> = { 
        success: true, 
        data: feedback 
      };

      // AC-02: Add warning message if at or above 80 feedbacks
      if (isWarning) {
        responseData.warning = {
          message: 'Quase no limite!',
          detail: `Este projeto já recebeu ${newMonthlyCount} de ${FREE_PLAN_LIMIT} feedbacks este mês. Considere fazer upgrade para o plano Pro.`,
          current_count: newMonthlyCount,
          limit: FREE_PLAN_LIMIT,
          upgrade_url: '/billing'
        };
      }

      return NextResponse.json(
        responseData,
        { status: 201, headers: { ...corsHeaders, ...rateLimitHeaders } }
      );
    }

    // Pro plan: No monthly limits
    // Check total feedback quota (for Pro, this might be higher)
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

    // Insert feedback for Pro users
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
        attachment_urls: validatedAttachmentUrls,
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
      .from('bmad_projects')
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
