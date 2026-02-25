import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders, getClientIP } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';
import type { WidgetPosition, WidgetTriggerType } from '@/types';

// Validation schema for creating a widget
const createWidgetSchema = z.object({
  project_id: z.string().uuid('ID do projeto inválido'),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (ex: #3b82f6)').optional(),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  trigger_type: z.enum(['button', 'auto', 'event']).optional(),
  enable_nps: z.boolean().optional(),
  enable_suggestions: z.boolean().optional(),
  enable_bugs: z.boolean().optional(),
  title: z.string().max(200, 'Título deve ter no máximo 200 caracteres').optional(),
  subtitle: z.string().max(500, 'Subtítulo deve ter no máximo 500 caracteres').optional(),
  thank_you_message: z.string().max(300, 'Mensagem de agradecimento deve ter no máximo 300 caracteres').optional(),
  is_active: z.boolean().optional(),
});

// Generate a unique widget key
function generateWidgetKey(): string {
  return `widget_${randomUUID().replace(/-/g, '')}`;
}

// GET /api/widgets - List all widgets for the authenticated user's projects
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    // Create Supabase client
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Build query - join with projects to verify ownership
    let query = supabase
      .from('widgets')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('projects.user_id', user.id);

    // Filter by project_id if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: widgets, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching widgets:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar widgets' },
        { status: 500 }
      );
    }

    // Sanitize response - remove nested project data
    const sanitizedWidgets = widgets?.map(widget => ({
      id: widget.id,
      project_id: widget.project_id,
      name: widget.name,
      widget_key: widget.widget_key,
      primary_color: widget.primary_color,
      position: widget.position,
      trigger_type: widget.trigger_type,
      enable_nps: widget.enable_nps,
      enable_suggestions: widget.enable_suggestions,
      enable_bugs: widget.enable_bugs,
      title: widget.title,
      subtitle: widget.subtitle,
      thank_you_message: widget.thank_you_message,
      is_active: widget.is_active,
      created_at: widget.created_at,
      updated_at: widget.updated_at,
    })) || [];

    return NextResponse.json(
      { data: sanitizedWidgets },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Error in GET /api/widgets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/widgets - Create a new widget
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createWidgetSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: { message: string }) => err.message).join(', ');
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create Supabase client
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', data.project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado ou acesso negado' },
        { status: 403 }
      );
    }

    // Generate unique widget key
    const widgetKey = generateWidgetKey();

    // Create widget with default values
    const { data: widget, error: createError } = await supabase
      .from('widgets')
      .insert({
        project_id: data.project_id,
        name: data.name,
        widget_key: widgetKey,
        primary_color: data.primary_color || '#3b82f6',
        position: (data.position || 'bottom-right') as WidgetPosition,
        trigger_type: (data.trigger_type || 'button') as WidgetTriggerType,
        enable_nps: data.enable_nps ?? true,
        enable_suggestions: data.enable_suggestions ?? true,
        enable_bugs: data.enable_bugs ?? true,
        title: data.title || 'Queremos seu feedback!',
        subtitle: data.subtitle || null,
        thank_you_message: data.thank_you_message || 'Obrigado pelo feedback!',
        is_active: data.is_active ?? true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating widget:', createError);
      return NextResponse.json(
        { error: 'Falha ao criar widget' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: widget },
      { status: 201, headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Error in POST /api/widgets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}