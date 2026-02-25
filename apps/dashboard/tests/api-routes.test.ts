import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../app/api/v1/feedbacks/route'
import { GET as getSingle, DELETE, PATCH } from '../app/api/v1/feedbacks/[id]/route'
import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    rpc: vi.fn(),
  })),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

describe('API Routes - Feedbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/feedbacks', () => {
    it('should return 401 when API key is missing', async () => {
      const request = new NextRequest('http://localhost/api/v1/feedbacks')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 403 when API key is invalid', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

      const request = new NextRequest('http://localhost/api/v1/feedbacks', {
        headers: { 'X-API-Key': 'invalid_key' },
      })
      const response = await GET(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should return feedbacks with pagination', async () => {
      // Mock project lookup
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true, allowed_domains: [] },
        error: null,
      })

      // Mock feedbacks query
      const mockFeedbacks = [
        { id: '1', type: 'nps', content: { score: 9 }, status: 'new', created_at: '2024-01-15' },
        { id: '2', type: 'bug', content: { description: 'Test' }, status: 'new', created_at: '2024-01-14' },
      ]

      mockSupabaseClient.from().select().eq().order().limit.mockResolvedValueOnce({
        data: mockFeedbacks,
        error: null,
        count: 2,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks?page=1&limit=10', {
        headers: { 'X-API-Key': 'valid_key' },
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.meta.page).toBe(1)
      expect(data.meta.limit).toBe(10)
    })

    it('should apply filters correctly', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true, allowed_domains: [] },
        error: null,
      })

      mockSupabaseClient.from().select().eq().eq().gte().lte().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest(
        'http://localhost/api/v1/feedbacks?type=nps&status=new&from=2024-01-01&to=2024-01-31',
        { headers: { 'X-API-Key': 'valid_key' } }
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should include rate limit headers', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true, allowed_domains: [] },
        error: null,
      })

      mockSupabaseClient.from().select().eq().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks', {
        headers: { 'X-API-Key': 'valid_key' },
      })
      const response = await GET(request)

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
  })

  describe('POST /api/v1/feedbacks', () => {
    it('should create NPS feedback', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true, allowed_domains: [] },
        error: null,
      })

      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: [{ allowed: true, remaining: 99, status: 'ok' }],
        error: null,
      })

      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: { id: 'feedback-1', type: 'nps', status: 'new', created_at: '2024-01-15' },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks', {
        method: 'POST',
        headers: { 'X-API-Key': 'valid_key', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nps',
          content: { score: 9, comment: 'Great product!' },
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('feedback-1')
    })

    it('should create suggestion feedback', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true, allowed_domains: [] },
        error: null,
      })

      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: [{ allowed: true, remaining: 99, status: 'ok' }],
        error: null,
      })

      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: { id: 'feedback-2', type: 'suggestion', status: 'new', created_at: '2024-01-15' },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks', {
        method: 'POST',
        headers: { 'X-API-Key': 'valid_key', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggestion',
          content: {
            title: 'Add dark mode',
            description: 'It would be great to have a dark mode option.',
            category: 'Feature',
          },
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('should return validation error for invalid data', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true, allowed_domains: [] },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks', {
        method: 'POST',
        headers: { 'X-API-Key': 'valid_key', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nps',
          content: { score: 15 }, // Invalid: score > 10
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 429 when quota exceeded', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true, allowed_domains: [] },
        error: null,
      })

      mockSupabaseClient.from().rpc.mockResolvedValueOnce({
        data: [{ allowed: false, remaining: 0, status: 'exceeded' }],
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks', {
        method: 'POST',
        headers: { 'X-API-Key': 'valid_key', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'nps',
          content: { score: 8 },
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.error.code).toBe('QUOTA_EXCEEDED')
    })
  })

  describe('DELETE /api/v1/feedbacks/:id', () => {
    it('should delete feedback', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true },
        error: null,
      })

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: { id: 'feedback-1' },
        error: null,
      })

      mockSupabaseClient.from().delete().eq().eq.mockResolvedValueOnce({
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks/feedback-1', {
        method: 'DELETE',
        headers: { 'X-API-Key': 'valid_key' },
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'feedback-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.deleted).toBe(true)
    })

    it('should return 404 for non-existent feedback', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true },
        error: null,
      })

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks/non-existent', {
        method: 'DELETE',
        headers: { 'X-API-Key': 'valid_key' },
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/v1/feedbacks/:id', () => {
    it('should update feedback status', async () => {
      mockSupabaseClient.from().eq().single.mockResolvedValueOnce({
        data: { id: 'project-1', api_key: 'valid_key', is_active: true },
        error: null,
      })

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: { id: 'feedback-1', status_history: [] },
        error: null,
      })

      mockSupabaseClient.from().update().eq().eq().select().single.mockResolvedValueOnce({
        data: { id: 'feedback-1', status: 'implemented', updated_at: '2024-01-15' },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/feedbacks/feedback-1', {
        method: 'PATCH',
        headers: { 'X-API-Key': 'valid_key', 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'implemented' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'feedback-1' }) })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('implemented')
    })
  })
})