import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDailySummary, generateWeeklySummary } from '@/lib/summary';
import { generateSummaryEmailHTML, generateSummaryEmailText } from '@/lib/email/summary-template';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * API Route: POST /api/summary/send
 * 
 * Sends a daily or weekly summary email for a specific project.
 * This can be called by a cron job or manually.
 * 
 * Query params:
 * - project_id: string (required)
 * - type: 'daily' | 'weekly' (required)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const type = searchParams.get('type') as 'daily' | 'weekly' | null;

    // Validate inputs
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!type || !['daily', 'weekly'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "daily" or "weekly"' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get project and user info
    const { data: project, error: projectError } = await supabase
      .from('bmad_projects')
      .select('id, name, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get notification preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences' },
        { status: 500 }
      );
    }

    // Check if summary is enabled
    const summaryEnabled = type === 'daily' 
      ? prefs?.daily_summary_enabled 
      : prefs?.weekly_summary_enabled;

    if (!summaryEnabled) {
      return NextResponse.json(
        { error: `${type} summary is not enabled for this project` },
        { status: 400 }
      );
    }

    // Get user's email using Supabase Auth Admin API
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user email' },
        { status: 500 }
      );
    }

    const user = users.find(u => u.id === project.user_id);
    const recipientEmail = prefs?.summary_email || user?.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No email address found for summary' },
        { status: 400 }
      );
    }

    // Generate summary data
    const summaryData = type === 'daily'
      ? await generateDailySummary(projectId)
      : await generateWeeklySummary(projectId);

    if (!summaryData) {
      return NextResponse.json(
        { error: 'Failed to generate summary data' },
        { status: 500 }
      );
    }

    // Generate email content
    const htmlContent = generateSummaryEmailHTML(summaryData, type);
    const textContent = generateSummaryEmailText(summaryData, type);

    // Send email using Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, returning summary data only');
      
      // Update last sent timestamp even if email wasn't sent (for testing)
      const updateField = type === 'daily' 
        ? 'last_daily_summary_sent' 
        : 'last_weekly_summary_sent';
      
      await supabase
        .from('notification_preferences')
        .update({ [updateField]: new Date().toISOString() })
        .eq('project_id', projectId);

      return NextResponse.json({
        success: true,
        warning: 'Email not sent - RESEND_API_KEY not configured',
        data: {
          projectId,
          type,
          recipientEmail,
          summary: summaryData,
        },
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TinyFeedback <resumo@tinyfeedback.app>',
        to: recipientEmail,
        subject: type === 'daily' 
          ? `📊 Resumo Diário - ${project.name}` 
          : `📊 Resumo Semanal - ${project.name}`,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send email', details: errorData },
        { status: 500 }
      );
    }

    const emailResult = await emailResponse.json();

    // Update last sent timestamp
    const updateField = type === 'daily' 
      ? 'last_daily_summary_sent' 
      : 'last_weekly_summary_sent';
    
    await supabase
      .from('notification_preferences')
      .update({ [updateField]: new Date().toISOString() })
      .eq('project_id', projectId);

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        type,
        recipientEmail,
        emailId: emailResult.id,
        summary: {
          totalFeedbacks: summaryData.totalFeedbacks,
          averageNps: summaryData.averageNps,
        },
      },
    });

  } catch (error) {
    console.error('Error in POST /api/summary/send:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
