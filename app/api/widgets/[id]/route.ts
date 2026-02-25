import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders, getClientIP } from '@/lib/rate-limit';
import type { WidgetPosition, WidgetTriggerType } from '@/types';

// Validation schema for updating a widget
const updateWidgetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (ex: #3b82f6)').optional(),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  trigger_type: z.enum(['button', 'auto', 'event']).optional(),
  enable_nps: z.boolean().optional(),
  enable_suggestions: z.boolean().optional(),
  enable_bugs: z.boolean().optional(),
  title: z.string().max(200, 'Título deve ter no máximo 200 caracteres').optional(),
  subtitle: z.string().max(500, 'Subtítulo deve ter no máximo 500 caracteres').optional().nullable(),
  thank_you_message: z.string().max(300, 'Mensagem de agradecimento deve ter no máximo 300 caracteres').optional(),
  is_active: z.boolean().optional(),
});

// GET /api/widgets/[id] - Get a specific widget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    // Fetch widget with project verification
    const { data: widget, error } = await supabase
      .from('widgets')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', id)
      .eq('projects.user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Widget não encontrado' },
          { status: 404 }
        );
      }
      console.error('Error fetching widget:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar widget' },
        { status: 500 }
      );
    }

    // Sanitize response - remove nested project data
    const sanitizedWidget = {
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
    };

    return NextResponse.json(
      { data: sanitizedWidget },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Error in GET /api/widgets/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/widgets/[id] - Update a widget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateWidgetSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: { message: string }) => err.message).join(', ');
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if there's anything to update
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }

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

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.primary_color !== undefined) updateData.primary_color = data.primary_color;
    if (data.position !== undefined) updateData.position = data.position as WidgetPosition;
    if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type as WidgetTriggerType;
    if (data.enable_nps !== undefined) updateData.enable_nps = data.enable_nps;
    if (data.enable_suggestions !== undefined) updateData.enable_suggestions = data.enable_suggestions;
    if (data.enable_bugs !== undefined) updateData.enable_bugs = data.enable_bugs;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.thank_you_message !== undefined) updateData.thank_you_message = data.thank_you_message;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    // Update widget with ownership verification
    const { data: widget, error } = await supabase
      .from('widgets')
      .update(updateData)
      .eq('id', id)
      .filter('projects.user_id', 'eq', user.id)
      .select(`
        id,
        project_id,
        name,
        widget_key,
        primary_color,
        position,
        trigger_type,
        enable_nps,
        enable_suggestions,
        enable_bugs,
        title,
        subtitle,
        thank_you_message,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Widget não encontrado' },
          { status: 404 }
        );
      }
      console.error('Error updating widget:', error);
      return NextResponse.json(
        { error: 'Falha ao atualizar widget' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: widget },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Error in PUT /api/widgets/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/widgets/[id] - Delete a widget
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

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

    // Delete widget with ownership verification
    const { error } = await supabase
      .from('widgets')
      .delete()
      .eq('id', id)
      .filter('projects.user_id', 'eq', user.id);

    if (error) {
      console.error('Error deleting widget:', error);
      return NextResponse.json(
        { error: 'Falha ao remover widget' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Widget removido com sucesso' },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Error in DELETE /api/widgets/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}