import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateFeedbackInput } from '@/types';

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

    // Create admin client to bypass RLS for service operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
