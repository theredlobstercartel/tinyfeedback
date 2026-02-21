import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * API Route: GET /api/summary/cron
 * 
 * Cron job endpoint for sending scheduled summaries.
 * Should be called by an external cron service (e.g., Vercel Cron, GitHub Actions)
 * at the appropriate times.
 * 
 * Query params:
 * - type: 'daily' | 'weekly' (required)
 * - secret: string (required - must match CRON_SECRET env var)
 * 
 * For daily summaries: Call at 9:00 AM
 * For weekly summaries: Call on Monday at 9:00 AM
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'weekly' | null;
    const secret = searchParams.get('secret');

    // Validate secret
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate type
    if (!type || !['daily', 'weekly'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "daily" or "weekly"' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all projects with the summary type enabled
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('project_id')
      .eq(type === 'daily' ? 'daily_summary_enabled' : 'weekly_summary_enabled', true);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences' },
        { status: 500 }
      );
    }

    if (!prefs || prefs.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No projects with ${type} summary enabled`,
        sent: 0,
      });
    }

    // Send summaries for each project
    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;

    for (const pref of prefs) {
      try {
        const response = await fetch(`${baseUrl}/api/summary/send?project_id=${pref.project_id}&type=${type}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        results.push({
          projectId: pref.project_id,
          success: response.ok,
          ...result,
        });
      } catch (error) {
        console.error(`Error sending ${type} summary for project ${pref.project_id}:`, error);
        results.push({
          projectId: pref.project_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      type,
      sent: successCount,
      failed: failureCount,
      results,
    });

  } catch (error) {
    console.error('Error in GET /api/summary/cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
