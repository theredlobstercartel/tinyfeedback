import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getApiKey,
  validateApiKey,
  checkRateLimit,
  validateOrigin,
  createApiSupabaseClient,
  createApiResponse,
  PaginationSchema,
  FeedbackFiltersSchema,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitedResponse,
  validationErrorResponse,
  addRateLimitHeaders,
  ApiResponse,
} from '@/lib/api-utils'

// GET /api/v1/feedbacks - List feedbacks
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now()

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

  // 4. Validate origin (CORS)
  if (!validateOrigin(request, project.allowed_domains || [])) {
    return forbiddenResponse('Domain not allowed')
  }

  // 5. Parse query parameters
  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)

  const paginationResult = PaginationSchema.safeParse(searchParams)
  const filtersResult = FeedbackFiltersSchema.safeParse(searchParams)

  if (!paginationResult.success || !filtersResult.success) {
    const errors = {
      ...(paginationResult.success ? {} : paginationResult.error.flatten().fieldErrors),
      ...(filtersResult.success ? {} : filtersResult.error.flatten().fieldErrors),
    }
    return validationErrorResponse(errors)
  }

  const { page, limit, cursor } = paginationResult.data
  const filters = filtersResult.data

  try {
    const supabase = createApiSupabaseClient()

    // Build query
    let query = supabase
      .from('feedbacks')
      .select('id, project_id, type, content, user_id, user_email, user_name, status, priority, created_at, updated_at', { count: 'exact' })
      .eq('project_id', project.id)

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.from) {
      query = query.gte('created_at', filters.from.toISOString())
    }
    if (filters.to) {
      query = query.lte('created_at', filters.to.toISOString())
    }

    // Apply cursor-based pagination if cursor provided
    if (cursor) {
      try {
        const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString())
        if (cursorData.created_at) {
          query = query.lt('created_at', cursorData.created_at)
        }
      } catch {
        // Invalid cursor, ignore
      }
    }

    // Apply sorting and limit
    query = query.order('created_at', { ascending: false }).limit(limit + 1)

    const { data: feedbacks, error, count } = await query

    if (error) {
      console.error('Error fetching feedbacks:', error)
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch feedbacks',
        }),
        { status: 500 }
      )
    }

    // Check if there are more results
    const hasMore = feedbacks.length > limit
    const results = hasMore ? feedbacks.slice(0, limit) : feedbacks

    // Generate next cursor
    let nextCursor: string | null = null
    if (hasMore && results.length > 0) {
      const lastItem = results[results.length - 1]
      nextCursor = Buffer.from(JSON.stringify({
        created_at: lastItem.created_at,
        id: lastItem.id,
      })).toString('base64')
    }

    const response = NextResponse.json(
      createApiResponse(
        true,
        results,
        undefined,
        {
          page,
          limit,
          total: count || 0,
          hasMore,
          nextCursor,
        }
      ),
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
    console.error('Error in GET /api/v1/feedbacks:', error)
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
      { status: 500 }
    )
  }
}

// POST /api/v1/feedbacks - Create feedback
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
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

  // 4. Validate origin (CORS)
  if (!validateOrigin(request, project.allowed_domains || [])) {
    return forbiddenResponse('Domain not allowed')
  }

  try {
    // 5. Parse and validate body
    const body = await request.json()

    // Schema for creating feedback
    const CreateFeedbackSchema = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('nps'),
        content: z.object({
          score: z.number().min(0).max(10),
          comment: z.string().max(500).optional(),
        }),
      }),
      z.object({
        type: z.literal('suggestion'),
        content: z.object({
          title: z.string().min(5).max(100),
          description: z.string().min(20).max(2000),
          category: z.string().optional(),
        }),
      }),
      z.object({
        type: z.literal('bug'),
        content: z.object({
          description: z.string().min(20).max(2000),
          includeTechnicalInfo: z.boolean().optional(),
          contactEmail: z.string().email().optional(),
        }),
      }),
    ])

    const UserInfoSchema = z.object({
      userId: z.string().optional(),
      userEmail: z.string().email().optional(),
      userName: z.string().optional(),
      userMetadata: z.record(z.unknown()).optional(),
      anonymousId: z.string().optional(),
      technicalContext: z.record(z.unknown()).optional(),
    })

    const RequestSchema = z.intersection(CreateFeedbackSchema, UserInfoSchema)

    const validationResult = RequestSchema.safeParse(body)

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error.flatten().fieldErrors)
    }

    const data = validationResult.data

    // 6. Check quota
    const supabase = createApiSupabaseClient()
    const { data: quotaCheck, error: quotaError } = await supabase.rpc(
      'check_and_update_quota',
      { p_project_id: project.id }
    )

    if (quotaError) {
      console.error('Error checking quota:', quotaError)
    } else if (quotaCheck && !quotaCheck[0]?.allowed) {
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'QUOTA_EXCEEDED',
          message: 'Monthly feedback quota exceeded. Please upgrade your plan.',
        }),
        { status: 429 }
      )
    }

    // 7. Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('feedbacks')
      .insert({
        project_id: project.id,
        type: data.type,
        content: data.content,
        user_id: data.userId,
        user_email: data.userEmail,
        user_name: data.userName,
        user_metadata: data.userMetadata,
        anonymous_id: data.anonymousId,
        technical_context: data.technicalContext,
        status: 'new',
        status_history: JSON.stringify([{
          status: 'new',
          changed_at: new Date().toISOString(),
          note: 'Created via API',
        }]),
      })
      .select('id, type, status, created_at')
      .single()

    if (insertError) {
      console.error('Error inserting feedback:', insertError)
      return NextResponse.json(
        createApiResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create feedback',
        }),
        { status: 500 }
      )
    }

    const response = NextResponse.json(
      createApiResponse(true, {
        id: feedback.id,
        type: feedback.type,
        status: feedback.status,
        createdAt: feedback.created_at,
      }),
      { status: 201 }
    )

    // Add rate limit headers
    return addRateLimitHeaders(
      response,
      rateLimit.limit,
      rateLimit.remaining,
      rateLimit.resetAt
    )
  } catch (error) {
    console.error('Error in POST /api/v1/feedbacks:', error)
    return NextResponse.json(
      createApiResponse(false, undefined, {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      }),
      { status: 500 }
    )
  }
}