import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Rate limit configuration
const RATE_LIMIT_MAX = 100 // requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

// Response headers for rate limiting
export const RATE_LIMIT_HEADERS = {
  LIMIT: 'X-RateLimit-Limit',
  REMAINING: 'X-RateLimit-Remaining',
  RESET: 'X-RateLimit-Reset',
}

// Standard API response format
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
    nextCursor?: string | null
  }
}

// API Error codes
export const ApiErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const

// Create standardized API response
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: unknown },
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  const response: ApiResponse<T> = { success }
  if (data !== undefined) response.data = data
  if (error) response.error = error
  if (meta) response.meta = meta
  return response
}

// Extract API key from request
export function getApiKey(request: NextRequest): string | null {
  const apiKey = request.headers.get('X-API-Key')
  if (apiKey) return apiKey

  // Also check query param (for testing)
  const url = new URL(request.url)
  const queryKey = url.searchParams.get('api_key')
  if (queryKey) return queryKey

  return null
}

// Validate API key and return project
export async function validateApiKey(apiKey: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, api_key, allowed_domains, is_active, user_id')
    .eq('api_key', apiKey)
    .single()

  if (error || !project) {
    return null
  }

  if (!project.is_active) {
    return null
  }

  return project
}

// Check rate limit
export function checkRateLimit(identifier: string): {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetAt) {
    // New window
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateLimitMap.set(identifier, { count: 1, resetAt })
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt,
    }
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX,
      remaining: 0,
      resetAt: record.resetAt,
    }
  }

  record.count++
  rateLimitMap.set(identifier, record)

  return {
    allowed: true,
    limit: RATE_LIMIT_MAX,
    remaining: RATE_LIMIT_MAX - record.count,
    resetAt: record.resetAt,
  }
}

// Validate origin/domain
export function validateOrigin(
  request: NextRequest,
  allowedDomains: string[]
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true // No domain restrictions
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  const sourceUrl = origin || referer
  if (!sourceUrl) {
    // Allow requests without origin (e.g., curl, server-to-server)
    return true
  }

  try {
    const sourceHostname = new URL(sourceUrl).hostname

    return allowedDomains.some((domain) => {
      // Exact match
      if (domain === sourceHostname) return true
      // Wildcard subdomain
      if (domain.startsWith('*.')) {
        const suffix = domain.slice(2)
        return sourceHostname === suffix || sourceHostname.endsWith('.' + suffix)
      }
      return false
    })
  } catch {
    return false
  }
}

// Pagination schema
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

// Feedback filters schema
export const FeedbackFiltersSchema = z.object({
  type: z.enum(['nps', 'suggestion', 'bug']).optional(),
  status: z.enum(['new', 'analyzing', 'implemented', 'archived']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

// Create Supabase client for API routes
export function createApiSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Error response helpers
export function unauthorizedResponse(message = 'API key is required'): NextResponse {
  return NextResponse.json(
    createApiResponse(false, undefined, {
      code: ApiErrorCodes.UNAUTHORIZED,
      message,
    }),
    { status: 401 }
  )
}

export function forbiddenResponse(message = 'Invalid API key or domain not allowed'): NextResponse {
  return NextResponse.json(
    createApiResponse(false, undefined, {
      code: ApiErrorCodes.FORBIDDEN,
      message,
    }),
    { status: 403 }
  )
}

export function rateLimitedResponse(resetAt: number): NextResponse {
  return NextResponse.json(
    createApiResponse(false, undefined, {
      code: ApiErrorCodes.RATE_LIMITED,
      message: 'Rate limit exceeded. Try again later.',
    }),
    {
      status: 429,
      headers: {
        [RATE_LIMIT_HEADERS.LIMIT]: String(RATE_LIMIT_MAX),
        [RATE_LIMIT_HEADERS.REMAINING]: '0',
        [RATE_LIMIT_HEADERS.RESET]: String(Math.ceil(resetAt / 1000)),
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  )
}

export function validationErrorResponse(details: unknown): NextResponse {
  return NextResponse.json(
    createApiResponse(false, undefined, {
      code: ApiErrorCodes.VALIDATION_ERROR,
      message: 'Validation failed',
      details,
    }),
    { status: 400 }
  )
}

export function notFoundResponse(resource = 'Resource'): NextResponse {
  return NextResponse.json(
    createApiResponse(false, undefined, {
      code: ApiErrorCodes.NOT_FOUND,
      message: `${resource} not found`,
    }),
    { status: 404 }
  )
}

export function internalErrorResponse(message = 'Internal server error'): NextResponse {
  return NextResponse.json(
    createApiResponse(false, undefined, {
      code: ApiErrorCodes.INTERNAL_ERROR,
      message,
    }),
    { status: 500 }
  )
}

// Add rate limit headers to response
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: number
): NextResponse {
  response.headers.set(RATE_LIMIT_HEADERS.LIMIT, String(limit))
  response.headers.set(RATE_LIMIT_HEADERS.REMAINING, String(remaining))
  response.headers.set(RATE_LIMIT_HEADERS.RESET, String(Math.ceil(resetAt / 1000)))
  return response
}