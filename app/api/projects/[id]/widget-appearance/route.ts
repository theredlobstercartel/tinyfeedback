import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Valid positions
const VALID_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
type WidgetPosition = typeof VALID_POSITIONS[number];

// Validate hex color
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
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
      .select('id, name, widget_color, widget_position, widget_text')
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
    console.error('Error in GET /api/projects/[id]/widget-appearance:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build update object with only provided fields
    const updates: {
      widget_color?: string;
      widget_position?: WidgetPosition;
      widget_text?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    // Validate and add color if provided
    if ('widget_color' in body) {
      if (!isValidHexColor(body.widget_color)) {
        return NextResponse.json(
          { error: 'Cor inválida. Use formato HEX (#RRGGBB)' },
          { status: 400 }
        );
      }
      updates.widget_color = body.widget_color;
    }

    // Validate and add position if provided
    if ('widget_position' in body) {
      if (!VALID_POSITIONS.includes(body.widget_position)) {
        return NextResponse.json(
          { error: `Posição inválida. Use: ${VALID_POSITIONS.join(', ')}` },
          { status: 400 }
        );
      }
      updates.widget_position = body.widget_position;
    }

    // Validate and add text if provided
    if ('widget_text' in body) {
      if (typeof body.widget_text !== 'string') {
        return NextResponse.json(
          { error: 'Texto deve ser uma string' },
          { status: 400 }
        );
      }
      if (body.widget_text.length > 50) {
        return NextResponse.json(
          { error: 'Texto deve ter no máximo 50 caracteres' },
          { status: 400 }
        );
      }
      updates.widget_text = body.widget_text;
    }

    // Check if there are any fields to update
    const hasUpdates = Object.keys(updates).length > 1; // > 1 because updated_at is always included
    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      );
    }

    // Update project
    const { data, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('id, name, widget_color, widget_position, widget_text')
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Falha ao atualizar configurações do widget' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/projects/[id]/widget-appearance:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
