import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Generate a unique API key
function generateApiKey(): string {
  return `tf_${randomUUID().replace(/-/g, '')}`;
}

// Generate a slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome do projeto é obrigatório' },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const description = body.description?.trim() || '';

    // Validate name length
    if (name.length < 3 || name.length > 100) {
      return NextResponse.json(
        { error: 'Nome do projeto deve ter entre 3 e 100 caracteres' },
        { status: 400 }
      );
    }

    // Get user from authorization header (JWT token from client)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Create client to verify token and get user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Generate unique slug
    let slug = generateSlug(name);
    let slugSuffix = 0;
    let slugExists = true;
    
    // Check if slug exists and append suffix if needed
    while (slugExists) {
      const checkSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug;
      const { data: existingProject } = await supabase
        .from('bmad_projects')
        .select('id')
        .eq('slug', checkSlug)
        .maybeSingle();
      
      if (!existingProject) {
        slug = checkSlug;
        slugExists = false;
      } else {
        slugSuffix++;
      }
    }

    // Create project
    const now = new Date().toISOString();
    const { data: project, error: createError } = await supabase
      .from('bmad_projects')
      .insert({
        name,
        slug,
        description,
        api_key: generateApiKey(),
        user_id: userId,
        widget_color: '#00ff88',
        widget_position: 'bottom-right',
        widget_text: 'Feedback',
        allowed_domains: [],
        plan: 'free',
        feedbacks_count: 0,
        max_feedbacks: 50,
        monthly_feedbacks_count: 0,
        monthly_feedbacks_reset_at: now,
        subscription_status: 'inactive',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error('Supabase create error:', createError);
      return NextResponse.json(
        { error: 'Falha ao criar projeto' },
        { status: 500 }
      );
    }

    // Create default notification preferences for the project
    const { error: notifError } = await supabase
      .from('notification_preferences')
      .insert({
        project_id: project.id,
        notify_nps: true,
        notify_suggestion: true,
        notify_bug: true,
        instant_notifications_enabled: true,
        daily_summary_enabled: false,
        weekly_summary_enabled: false,
        summary_email: user.email,
        created_at: now,
        updated_at: now,
      });

    if (notifError) {
      console.error('Notification preferences error:', notifError);
      // Don't fail the project creation if notification prefs fail
    }

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Get all projects for the current user
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const { data: projects, error } = await supabase
      .from('bmad_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar projetos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
