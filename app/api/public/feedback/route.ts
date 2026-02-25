import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { 
  getClientIP, 
  checkWidgetIPRateLimit, 
  checkWidgetGlobalRateLimit,
  getRateLimitHeaders, 
  generateTicketId 
} from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CORS headers for public endpoint - allow all origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ST-14: Zod schema for request validation
const feedbackSchema = z.object({
  widgetId: z.string().uuid('widgetId inválido'),
  type: z.enum(['nps', 'suggestion', 'bug']),
  nps_score: z.number().min(0).max(10).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1, 'Conteúdo é obrigatório').max(5000),
  user_email: z.string().email().max(255).optional().nullable(),
  user_id: z.string().max(255).optional().nullable(),
  page_url: z.string().url().max(2000).optional().nullable(),
  screenshot_url: z.string().url().max(2000).optional().nullable(),
});

/**
 * Sanitize HTML content to prevent XSS
 */
function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  });
}

/**
 * POST /api/public/feedback
 * Create new feedback from embedded widget (public endpoint)
 * ST-14: Public endpoint with CORS, rate limiting, and ticket generation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  
  try {
    // Check IP-based rate limit (5 requests per minute)
    const ipRateLimit = checkWidgetIPRateLimit(clientIP);
    if (!ipRateLimit.success) {
      const headers = getRateLimitHeaders(ipRateLimit);
      return NextResponse.json(
        { 
          error: 'RATE_LIMIT_IP',
          message: 'Muitas tentativas. Tente novamente em alguns minutos.',
          retryAfter: ipRateLimit.retryAfter 
        },
        { 
          status: 429, 
          headers: { ...corsHeaders, ...headers }
        }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Requisição inválida: JSON malformado' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate with Zod
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR', 
          message: 'Dados inválidos',
          details: errors 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = validationResult.data;

    // Check widget-specific rate limit (100 per hour)
    const widgetRateLimit = checkWidgetGlobalRateLimit(data.widgetId);
    if (!widgetRateLimit.success) {
      const headers = getRateLimitHeaders(widgetRateLimit);
      return NextResponse.json(
        { 
          error: 'RATE_LIMIT_WIDGET',
          message: 'Limite de feedbacks atingido para este widget. Tente novamente mais tarde.',
          retryAfter: widgetRateLimit.retryAfter 
        },
        { 
          status: 429, 
          headers: { ...corsHeaders, ...headers }
        }
      );
    }

    // Type-specific validation
    if (data.type === 'nps' && (data.nps_score === null || data.nps_score === undefined)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'nps_score é obrigatório para tipo NPS' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (data.type === 'suggestion' && !data.title) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Título é obrigatório para sugestões' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate widgetId (check if project exists and is active)
    const { data: project, error: projectError } = await supabase
      .from('bmad_projects')
      .select('id, api_key, allowed_domains, plan, subscription_status, feedbacks_count, max_feedbacks')
      .eq('id', data.widgetId)
      .single();

    if (projectError || !project) {
      // Log for security analysis
      console.warn(`[ST-14] Invalid widgetId attempt: ${data.widgetId}, IP: ${clientIP}`);
      return NextResponse.json(
        { error: 'WIDGET_NOT_FOUND', message: 'Widget não encontrado ou inativo' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check plan limits (only for non-Pro projects)
    const isPro = project.plan === 'pro' && project.subscription_status === 'active';
    if (!isPro && project.feedbacks_count >= project.max_feedbacks) {
      return NextResponse.json(
        { 
          error: 'LIMIT_REACHED',
          message: 'Este projeto atingiu o limite de feedbacks. Faça upgrade para continuar.'
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Generate ticket ID
    const ticketId = generateTicketId();

    // Sanitize text fields
    const sanitizedContent = sanitizeHtml(data.content);
    const sanitizedTitle = data.title ? sanitizeHtml(data.title) : null;

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('feedbacks')
      .insert({
        project_id: data.widgetId,
        type: data.type,
        nps_score: data.nps_score ?? null,
        content: sanitizedContent,
        title: sanitizedTitle,
        page_url: data.page_url || null,
        user_agent: request.headers.get('user-agent') || null,
        user_email: data.user_email || null,
        user_id: data.user_id || null,
        screenshot_url: data.screenshot_url || null,
        status: 'new',
        response_sent: false,
        internal_notes: null,
        response_content: null,
        // Store ticketId in internal_notes for reference (or could add a ticket_id column)
        ticket_id: ticketId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ST-14] Error inserting feedback:', insertError);
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Erro ao salvar feedback. Tente novamente.' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Increment project feedback count
    await supabase
      .from('bmad_projects')
      .update({ feedbacks_count: (project.feedbacks_count || 0) + 1 })
      .eq('id', data.widgetId);

    // Log success for security analysis
    const responseTime = Date.now() - startTime;
    console.log(`[ST-14] Feedback created: ticket=${ticketId}, widget=${data.widgetId}, type=${data.type}, ip=${clientIP}, time=${responseTime}ms`);

    // Build response headers
    const rateLimitHeaders = {
      ...getRateLimitHeaders(ipRateLimit),
      'X-Widget-RateLimit-Limit': widgetRateLimit.limit.toString(),
      'X-Widget-RateLimit-Remaining': widgetRateLimit.remaining.toString(),
    };

    return NextResponse.json(
      { 
        success: true, 
        ticketId,
        message: 'Feedback recebido com sucesso!'
      },
      { status: 201, headers: { ...corsHeaders, ...rateLimitHeaders } }
    );

  } catch (error) {
    console.error('[ST-14] Error in POST /api/public/feedback:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 * ST-14: Allow all origins for CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { 
    status: 204,
    headers: corsHeaders 
  });
}
