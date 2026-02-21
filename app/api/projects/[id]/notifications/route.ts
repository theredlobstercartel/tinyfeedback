import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateNotificationPreferencesInput } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch notification preferences for the project
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('project_id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar preferências de notificação' },
        { status: 500 }
      );
    }

    // If no preferences exist, return default values
    if (!data) {
      return NextResponse.json({
        data: {
          project_id: id,
          notify_nps: true,
          notify_suggestion: true,
          notify_bug: true,
          daily_summary_enabled: false,
          weekly_summary_enabled: false,
          summary_email: null,
          last_daily_summary_sent: null,
          last_weekly_summary_sent: null,
        },
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/notifications:', error);
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
    const body: UpdateNotificationPreferencesInput = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input - at least one field should be provided
    const validFields = ['notify_nps', 'notify_suggestion', 'notify_bug', 'daily_summary_enabled', 'weekly_summary_enabled', 'summary_email'];
    const hasValidField = validFields.some(field => field in body);
    
    if (!hasValidField) {
      return NextResponse.json(
        { error: 'Nenhuma preferência válida fornecida' },
        { status: 400 }
      );
    }

    // Check if preferences already exist for this project
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('project_id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao verificar preferências existentes' },
        { status: 500 }
      );
    }

    let result;

    if (existingPrefs) {
      // Update existing preferences
      const { data, error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json(
          { error: 'Falha ao atualizar preferências de notificação' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new preferences with defaults
      const { data, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          project_id: id,
          notify_nps: body.notify_nps ?? true,
          notify_suggestion: body.notify_suggestion ?? true,
          notify_bug: body.notify_bug ?? true,
          daily_summary_enabled: body.daily_summary_enabled ?? false,
          weekly_summary_enabled: body.weekly_summary_enabled ?? false,
          summary_email: body.summary_email ?? null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return NextResponse.json(
          { error: 'Falha ao criar preferências de notificação' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in PATCH /api/projects/[id]/notifications:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
