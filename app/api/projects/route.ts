import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateApiKey } from '@/lib/utils/api-key';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateProjectInput = await request.json();

    // Validate name
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do projeto é obrigatório' },
        { status: 400 }
      );
    }

    if (body.name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nome do projeto deve ter pelo menos 3 caracteres' },
        { status: 400 }
      );
    }

    if (body.name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Nome do projeto deve ter no máximo 100 caracteres' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (slug.length < 1) {
      return NextResponse.json(
        { error: 'Nome do projeto deve conter caracteres válidos' },
        { status: 400 }
      );
    }

    // Generate unique API key
    const apiKey = generateApiKey();

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if slug already exists
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (checkError) {
      console.error('Supabase check error:', checkError);
      return NextResponse.json(
        { error: 'Erro ao verificar disponibilidade do nome' },
        { status: 500 }
      );
    }

    if (existingProject) {
      return NextResponse.json(
        { error: 'Já existe um projeto com este nome. Escolha um nome diferente.' },
        { status: 409 }
      );
    }

    // Insert new project
    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        name: body.name.trim(),
        slug,
        api_key: apiKey,
        description: body.description?.trim() || null,
        widget_color: '#00ff88',
        widget_position: 'bottom-right',
        widget_text: 'Feedback',
        allowed_domains: [],
        plan: 'free',
        feedbacks_count: 0,
        max_feedbacks: 100,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Falha ao criar projeto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Get all projects
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, slug, description, plan, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar projetos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
