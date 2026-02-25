import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST, OPTIONS } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const chain = {
        select: mockSelect.mockReturnThis(),
        insert: mockInsert.mockReturnThis(),
        update: mockUpdate.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        single: mockSingle,
      };
      return chain;
    }),
  })),
}));

// Mock rate limit functions
vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual('@/lib/rate-limit');
  return {
    ...actual,
    getClientIP: vi.fn(() => '127.0.0.1'),
    checkWidgetIPRateLimit: vi.fn(() => ({
      success: true,
      limit: 5,
      remaining: 4,
      resetTime: Date.now() + 60000,
    })),
    checkWidgetGlobalRateLimit: vi.fn(() => ({
      success: true,
      limit: 100,
      remaining: 99,
      resetTime: Date.now() + 3600000,
    })),
  };
});

describe('POST /api/public/feedback', () => {
  const mockProject = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    api_key: 'test-api-key',
    allowed_domains: [],
    plan: 'free',
    subscription_status: 'inactive',
    feedbacks_count: 0,
    max_feedbacks: 100,
  };

  const mockFeedback = {
    id: 'feedback-123',
    project_id: mockProject.id,
    type: 'suggestion',
    title: 'Test Title',
    content: 'Test content',
    ticket_id: 'TF-ABCDEF12',
    created_at: new Date().toISOString(),
  };

  const createRequest = (body: unknown, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/public/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    
    // Default successful project lookup
    mockSingle.mockResolvedValue({
      data: mockProject,
      error: null,
    });

    // Default successful insert
    mockInsert.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: mockFeedback,
          error: null,
        })),
      })),
    });

    // Default successful update
    mockUpdate.mockReturnValue({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // AC-01: Endpoint accepts POST requests from any origin
  it('should accept POST requests and return 201 with ticketId', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'suggestion',
      title: 'Test Title',
      content: 'Test content',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.ticketId).toMatch(/^TF-[A-Z0-9]{8}$/);
    expect(data.message).toBe('Feedback recebido com sucesso!');
  });

  // AC-02: Validate widgetId
  it('should return 404 for invalid widgetId', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    });

    const request = createRequest({
      widgetId: '550e8400-e29b-41d4-a716-446655440001',
      type: 'suggestion',
      title: 'Test',
      content: 'Test content',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('WIDGET_NOT_FOUND');
    expect(data.message).toBe('Widget não encontrado ou inativo');
  });

  // AC-03: Accept different feedback types
  it('should accept NPS feedback', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'nps',
      nps_score: 8,
      content: 'Great service!',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('should accept bug feedback', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'bug',
      content: 'Found a bug!',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('should reject invalid feedback type', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'invalid_type',
      content: 'Test',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.details).toBeDefined();
  });

  // AC-04: Validate and sanitize data
  it('should reject missing content', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'suggestion',
      title: 'Test',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('should require title for suggestions', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'suggestion',
      content: 'Test content without title',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('Título é obrigatório');
  });

  it('should require nps_score for NPS type', async () => {
    mockSingle.mockResolvedValueOnce({
      data: mockProject,
      error: null,
    });

    const request = createRequest({
      widgetId: mockProject.id,
      type: 'nps',
      content: 'NPS without score',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('nps_score');
  });

  it('should validate nps_score range', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'nps',
      nps_score: 15,
      content: 'Invalid score',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should reject invalid widgetId format', async () => {
    const request = createRequest({
      widgetId: 'not-a-uuid',
      type: 'suggestion',
      title: 'Test',
      content: 'Content',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  // AC-06: Return appropriate errors
  it('should return 400 for invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/public/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('INVALID_JSON');
  });

  it('should return 429 when widget limit reached', async () => {
    const { checkWidgetGlobalRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkWidgetGlobalRateLimit).mockReturnValueOnce({
      success: false,
      limit: 100,
      remaining: 0,
      resetTime: Date.now() + 3600000,
      retryAfter: 3600,
    });

    const request = createRequest({
      widgetId: mockProject.id,
      type: 'suggestion',
      title: 'Test',
      content: 'Content',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('RATE_LIMIT_WIDGET');
    expect(data.retryAfter).toBeDefined();
  });

  // AC-05: Return 201 with ticketId on success
  it('should return proper CORS headers', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'suggestion',
      title: 'Test',
      content: 'Content',
    });

    const response = await POST(request);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('should generate unique ticketId format', async () => {
    const request = createRequest({
      widgetId: mockProject.id,
      type: 'suggestion',
      title: 'Test',
      content: 'Content',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ticketId).toMatch(/^TF-[A-Z0-9]{8}$/);
  });
});

describe('OPTIONS /api/public/feedback', () => {
  it('should return CORS headers for preflight', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
