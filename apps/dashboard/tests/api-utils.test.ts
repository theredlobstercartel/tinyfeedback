import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createApiResponse,
  getApiKey,
  checkRateLimit,
  validateOrigin,
  createApiSupabaseClient,
  addRateLimitHeaders,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitedResponse,
  validationErrorResponse,
  notFoundResponse,
} from '../lib/api-utils'
import { NextRequest } from 'next/server'

// Mock environment variables
vi.stubGlobal('process', {
  ...process,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
  },
})

describe('API Utils', () => {
  describe('createApiResponse', () => {
    it('should create success response', () => {
      const response = createApiResponse(true, { id: '1' }, undefined, { page: 1, limit: 10 })
      expect(response.success).toBe(true)
      expect(response.data).toEqual({ id: '1' })
      expect(response.meta).toEqual({ page: 1, limit: 10 })
    })

    it('should create error response', () => {
      const response = createApiResponse(false, undefined, {
        code: 'ERROR',
        message: 'Something went wrong',
      })
      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('ERROR')
    })

    it('should create response without optional fields', () => {
      const response = createApiResponse(true, { id: '1' })
      expect(response.success).toBe(true)
      expect(response.data).toEqual({ id: '1' })
      expect(response.error).toBeUndefined()
      expect(response.meta).toBeUndefined()
    })
  })

  describe('getApiKey', () => {
    it('should extract API key from header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'X-API-Key': 'test_key_123' },
      })
      expect(getApiKey(request)).toBe('test_key_123')
    })

    it('should extract API key from query param', () => {
      const request = new NextRequest('http://localhost/api/test?api_key=query_key_456')
      expect(getApiKey(request)).toBe('query_key_456')
    })

    it('should prefer header over query param', () => {
      const request = new NextRequest('http://localhost/api/test?api_key=query_key', {
        headers: { 'X-API-Key': 'header_key' },
      })
      expect(getApiKey(request)).toBe('header_key')
    })

    it('should return null when no API key provided', () => {
      const request = new NextRequest('http://localhost/api/test')
      expect(getApiKey(request)).toBeNull()
    })
  })

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear rate limit map between tests
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should allow first request', () => {
      const result = checkRateLimit('key-1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)
      expect(result.limit).toBe(100)
    })

    it('should track multiple requests', () => {
      checkRateLimit('key-2')
      checkRateLimit('key-2')
      checkRateLimit('key-2')

      const result = checkRateLimit('key-2')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(96)
    })

    it('should block after limit reached', () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        checkRateLimit('key-3')
      }

      const result = checkRateLimit('key-3')
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', () => {
      // Exhaust the limit
      for (let i = 0; i < 100; i++) {
        checkRateLimit('key-4')
      }

      expect(checkRateLimit('key-4').allowed).toBe(false)

      // Advance time by 61 seconds
      vi.advanceTimersByTime(61000)

      const result = checkRateLimit('key-4')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)
    })

    it('should track different keys separately', () => {
      // Exhaust one key
      for (let i = 0; i < 100; i++) {
        checkRateLimit('key-a')
      }

      // Other key should still work
      const result = checkRateLimit('key-b')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)
    })
  })

  describe('validateOrigin', () => {
    it('should allow when no domains configured', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { origin: 'https://evil.com' },
      })
      expect(validateOrigin(request, [])).toBe(true)
    })

    it('should allow matching domain', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { origin: 'https://example.com' },
      })
      expect(validateOrigin(request, ['example.com'])).toBe(true)
    })

    it('should block non-matching domain', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { origin: 'https://evil.com' },
      })
      expect(validateOrigin(request, ['example.com'])).toBe(false)
    })

    it('should allow wildcard subdomain', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { origin: 'https://app.example.com' },
      })
      expect(validateOrigin(request, ['*.example.com'])).toBe(true)
    })

    it('should allow requests without origin', () => {
      const request = new NextRequest('http://localhost/api/test')
      expect(validateOrigin(request, ['example.com'])).toBe(true)
    })

    it('should check referer when origin not present', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { referer: 'https://example.com/page' },
      })
      expect(validateOrigin(request, ['example.com'])).toBe(true)
    })
  })

  describe('createApiSupabaseClient', () => {
    it('should create client with correct config', () => {
      const client = createApiSupabaseClient()
      expect(client).toBeDefined()
    })
  })

  describe('error responses', () => {
    it('should create unauthorized response', () => {
      const response = unauthorizedResponse()
      expect(response.status).toBe(401)
    })

    it('should create forbidden response', () => {
      const response = forbiddenResponse()
      expect(response.status).toBe(403)
    })

    it('should create rate limited response', () => {
      const resetAt = Date.now() + 60000
      const response = rateLimitedResponse(resetAt)
      expect(response.status).toBe(429)
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('Retry-After')).toBeDefined()
    })

    it('should create validation error response', () => {
      const details = { field: 'email', message: 'Invalid email' }
      const response = validationErrorResponse(details)
      expect(response.status).toBe(400)
    })

    it('should create not found response', () => {
      const response = notFoundResponse('User')
      expect(response.status).toBe(404)
    })
  })

  describe('addRateLimitHeaders', () => {
    it('should add headers to response', () => {
      const originalResponse = new Response(JSON.stringify({ success: true }))
      const response = addRateLimitHeaders(originalResponse, 100, 95, Date.now() + 60000)

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('95')
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
  })
})