import { NextRequest, NextResponse } from 'next/server'
import {
  getApiKey,
  validateApiKey,
  checkRateLimit,
  createApiSupabaseClient,
  createApiResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitedResponse,
  notFoundResponse,
  addRateLimitHeaders,
  ApiResponse,
} from '@/lib/api-utils'

// DELETE /api/v1/feedbacks/:id - Delete feedback
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params

  // 1. Extract and validate API key
  const apiKey = getApiKey(request)
  if (!apiKey) {
    return unauthorizedResponse()
  }

  // 2. Validate API key
  const project = await validateApiKey(apiKey)
  if (!project) {
    return forbiddenResponse()
  }

  // 3. Check rate limit
  const rateLimit = checkRateLimit(apiKey)
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit.resetAt)
  }

  try {
    const supabase = createApiSupabaseClient()

    // 4. Check if feedback exists and belongs to this project
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedbacks')
      .select('id')
      .eq('id', id)
      .eq('project_id', project.id)
      .single()

    if (checkError || !existingFeedback) {
      return notFoundResponse('Feedback')
    }

    // 5. Delete feedback (soft delete by updating status)
    // Note: For actual deletion, use a service role key
    const { error: deleteError } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id)
      .eq('project_id', project.id)

    if (deleteError) {
      console.error('Error deleting feedback:', deleteError)
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete feedback',
        }),
        { status: 500 }
      )
    }

    const response = NextResponse.json(
      createApiResponse(true, {
        id,
        deleted: true,
      }),
      { status: 200 }
    )

    // Add rate limit headers
    return addRateLimitHeaders(
      response,
      rateLimit.limit,
      rateLimit.remaining,
      rateLimit.resetAt
    )
  } catch (error) {
    console.error('Error in DELETE /api/v1/feedbacks/:id:', error)
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
      { status: 500 }
    )
  }
}

// GET /api/v1/feedbacks/:id - Get single feedback
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params

  // 1. Extract and validate API key
  const apiKey = getApiKey(request)
  if (!apiKey) {
    return unauthorizedResponse()
  }

  // 2. Validate API key
  const project = await validateApiKey(apiKey)
  if (!project) {
    return forbiddenResponse()
  }

  // 3. Check rate limit
  const rateLimit = checkRateLimit(apiKey)
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit.resetAt)
  }

  try {
    const supabase = createApiSupabaseClient()

    // 4. Get feedback
    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .select('id, project_id, type, content, user_id, user_email, user_name, status, priority, status_history, technical_context, created_at, updated_at')
      .eq('id', id)
      .eq('project_id', project.id)
      .single()

    if (error || !feedback) {
      return notFoundResponse('Feedback')
    }

    const response = NextResponse.json(
      createApiResponse(true, feedback),
      { status: 200 }
    )

    // Add rate limit headers
    return addRateLimitHeaders(
      response,
      rateLimit.limit,
      rateLimit.remaining,
      rateLimit.resetAt
    )
  } catch (error) {
    console.error('Error in GET /api/v1/feedbacks/:id:', error)
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
      { status: 500 }
    )
  }
}

// PATCH /api/v1/feedbacks/:id - Update feedback status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  const { id } = await params

  // 1. Extract and validate API key
  const apiKey = getApiKey(request)
  if (!apiKey) {
    return unauthorizedResponse()
  }

  // 2. Validate API key
  const project = await validateApiKey(apiKey)
  if (!project) {
    return forbiddenResponse()
  }

  // 3. Check rate limit
  const rateLimit = checkRateLimit(apiKey)
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit.resetAt)
  }

  try {
    // 4. Parse and validate body
    const body = await request.json()

    // Only allow status updates via API
    const allowedUpdates = ['status', 'priority']
    const updates: Record<string, unknown> = {}

    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'No valid fields to update. Allowed: status, priority',
        }),
        { status: 400 }
      )
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['new', 'analyzing', 'implemented', 'archived']
      if (!validStatuses.includes(updates.status as string)) {
        return NextResponse.json(
          createApiResponse(false, undefined, {
            code: 'VALIDATION_ERROR',
            message: `Invalid status. Allowed: ${validStatuses.join(', ')}`,
          }),
          { status: 400 }
        )
      }
    }

    const supabase = createApiSupabaseClient()

    // 5. Check if feedback exists and belongs to this project
    const { data: existingFeedback, error: checkError } = await supabase
      .from('feedbacks')
      .select('id, status_history')
      .eq('id', id)
      .eq('project_id', project.id)
      .single()

    if (checkError || !existingFeedback) {
      return notFoundResponse('Feedback')
    }

    // 6. Update feedback
    const { data: feedback, error: updateError } = await supabase
      .from('feedbacks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        status_history: JSON.stringify([
          ...(Array.isArray(existingFeedback.status_history) ? existingFeedback.status_history : []),
          ...(updates.status ? [{
            status: updates.status,
            changed_at: new Date().toISOString(),
            note: 'Updated via API',
          }] : []),
        ]),
      })
      .eq('id', id)
      .eq('project_id', project.id)
      .select('id, type, status, priority, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating feedback:', updateError)
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update feedback',
        }),
        { status: 500 }
      )
    }

    const response = NextResponse.json(
      createApiResponse(true, feedback),
      { status: 200 }
    )

    // Add rate limit headers
    return addRateLimitHeaders(
      response,
      rateLimit.limit,
      rateLimit.remaining,
      rateLimit.resetAt
    )
  } catch (error) {
    console.error('Error in PATCH /api/v1/feedbacks/:id:', error)
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
      { status: 500 }
    )
  }
}