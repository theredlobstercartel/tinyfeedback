import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BugReportRequest {
  type: 'bug';
  content: string;
  screenshot_url?: string;
  apiKey: string;
  page_url?: string;
  user_agent?: string;
  user_email?: string;
}

/**
 * POST /api/widget/feedback
 * 
 * Recebe feedback do widget (bug reports, sugestões, etc.)
 * Valida a API key e salva no Supabase
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: BugReportRequest = await request.json();

    // Validações
    if (!body.apiKey || typeof body.apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key é obrigatória', success: false },
        { status: 400 }
      );
    }

    if (!body.type || body.type !== 'bug') {
      return NextResponse.json(
        { error: 'Tipo inválido. Use type="bug"', success: false },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo é obrigatório', success: false },
        { status: 400 }
      );
    }

    // Criar cliente admin para bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar API key e obter projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, max_feedbacks, feedbacks_count')
      .eq('api_key', body.apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'API key inválida', success: false },
        { status: 401 }
      );
    }

    // Verificar limite de feedbacks
    if (project.feedbacks_count >= project.max_feedbacks) {
      return NextResponse.json(
        { error: 'Limite de feedbacks atingido para este projeto', success: false },
        { status: 429 }
      );
    }

    // Preparar dados do feedback
    const feedbackData = {
      project_id: project.id,
      type: body.type,
      content: body.content.trim(),
      screenshot_url: body.screenshot_url || null,
      page_url: body.page_url || null,
      user_agent: body.user_agent || null,
      user_email: body.user_email || null,
      status: 'new',
      nps_score: null,
      title: null,
    };

    // Inserir no Supabase
    const { data: feedback, error: insertError } = await supabase
      .from('feedbacks')
      .insert(feedbackData)
      .select('id')
      .single();

    if (insertError) {
      console.error('Erro ao inserir feedback:', insertError);
      return NextResponse.json(
        { error: 'Erro ao salvar feedback', success: false },
        { status: 500 }
      );
    }

    // Incrementar contador de feedbacks do projeto
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        feedbacks_count: project.feedbacks_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    if (updateError) {
      console.error('Erro ao atualizar contador:', updateError);
      // Não falhar a requisição por causa do contador
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Bug reportado com sucesso!',
    });

  } catch (error) {
    console.error('Erro na API de feedback:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', success: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/widget/feedback
 * 
 * Endpoint para verificar se a API está funcionando
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    message: 'Widget feedback API - Use POST para enviar feedback',
  });
}
