import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateDomain, normalizeDomain } from '@/lib/utils/domain';
import { UpdateProjectDomainsInput } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: UpdateProjectDomainsInput = await request.json();

    // Validate action
    if (!body.action || !['add', 'remove'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "add" ou "remove"' },
        { status: 400 }
      );
    }

    // Validate domain presence
    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json(
        { error: 'Domínio é obrigatório' },
        { status: 400 }
      );
    }

    const normalizedDomain = normalizeDomain(body.domain);

    // Create admin client to bypass RLS for service operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current project data
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('allowed_domains')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    const currentDomains = project?.allowed_domains || [];

    let updatedDomains: string[];

    if (body.action === 'add') {
      // Validate domain format
      const validation = validateDomain(normalizedDomain, currentDomains);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Add domain
      updatedDomains = [...currentDomains, normalizedDomain];
    } else {
      // Remove domain
      updatedDomains = currentDomains.filter(d => d !== normalizedDomain);
    }

    // Update project
    const { data, error: updateError } = await supabase
      .from('projects')
      .update({
        allowed_domains: updatedDomains,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Falha ao atualizar domínios' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/projects/[id]/domains:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, allowed_domains')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/domains:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
