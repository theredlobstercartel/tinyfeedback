import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateFeedbackInput } from '@/types';
import { sendResponseEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Valid workflow statuses
const VALID_WORKFLOW_STATUSES = ['new', 'in_analysis', 'implemented'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: UpdateFeedbackInput = await request.json();

    // Validate input
    if (body.internal_notes !== undefined && typeof body.internal_notes !== 'string') {
      return NextResponse.json(
        { error: 'internal_notes must be a string' },
        { status: 400 }
      );
    }

    if (body.status !== undefined && typeof body.status !== 'string') {
      return NextResponse.json(
        { error: 'status must be a string' },
        { status: 400 }
      );
    }

    if (body.workflow_status !== undefined) {
      if (typeof body.workflow_status !== 'string') {
        return NextResponse.json(
          { error: 'workflow_status must be a string' },
          { status: 400 }
        );
      }
      if (!VALID_WORKFLOW_STATUSES.includes(body.workflow_status)) {
        return NextResponse.json(
          { error: `workflow_status must be one of: ${VALID_WORKFLOW_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    if (body.response_content !== undefined && typeof body.response_content !== 'string') {
      return NextResponse.json(
        { error: 'response_content must be a string' },
        { status: 400 }
      );
    }

    if (body.response_sent !== undefined && typeof body.response_sent !== 'boolean') {
      return NextResponse.json(
        { error: 'response_sent must be a boolean' },
        { status: 400 }
      );
    }

    // Create admin client to bypass RLS for service operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current feedback to check for changes
    const { data: currentFeedback, error: fetchError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Fetch project name separately
    let projectName = 'Projeto';
    if (currentFeedback.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', currentFeedback.project_id)
        .single();
      
      if (projectData) {
        projectName = projectData.name;
      }
    }

    const { data, error } = await supabase
      .from('feedbacks')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    // Send email if response was just marked as sent and there's content and email
    const shouldSendEmail = 
      body.response_sent === true &&
      body.response_content &&
      currentFeedback.user_email &&
      !currentFeedback.response_sent; // Only send if it wasn't already responded

    if (shouldSendEmail && body.response_content) {
      try {
        await sendResponseEmail(
          currentFeedback.user_email,
          {
            projectName,
            feedback: currentFeedback,
            responseContent: body.response_content,
          }
        );
      } catch (emailError) {
        console.error('Error sending response email:', emailError);
        // Don't fail the request if email fails, just log it
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/feedbacks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      .from('feedbacks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/feedbacks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
