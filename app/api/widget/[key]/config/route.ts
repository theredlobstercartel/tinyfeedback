import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CORS headers for widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Valid positions
const VALID_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
type WidgetPosition = typeof VALID_POSITIONS[number];

/**
 * GET /api/widget/[key]/config
 * Returns widget configuration based on the widget API key
 * This is a public endpoint (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse> {
  try {
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: 'Widget key is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find project by api_key (widget key)
    const { data: project, error } = await supabase
      .from('bmad_projects')
      .select('id, name, api_key, widget_color, widget_position, widget_text, allowed_domains')
      .eq('api_key', key)
      .single();

    if (error || !project) {
      console.error('Widget config fetch error:', error);
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Validate and sanitize position
    const position: WidgetPosition = VALID_POSITIONS.includes(project.widget_position as WidgetPosition)
      ? (project.widget_position as WidgetPosition)
      : 'bottom-right';

    // Return widget configuration
    const config = {
      project_id: project.id,
      project_name: project.name,
      api_key: project.api_key,
      primaryColor: project.widget_color || '#00ff88',
      position: position,
      title: project.widget_text || 'Queremos seu feedback!',
      subtitle: '',
      thankYouMessage: 'Obrigado pelo feedback!',
      enableNps: true,
      enableSuggestions: true,
      enableBugs: true,
      allowed_domains: project.allowed_domains || [],
    };

    return NextResponse.json(config, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error in GET /api/widget/[key]/config:', error);
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
