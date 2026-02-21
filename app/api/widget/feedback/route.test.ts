import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  })),
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({
        data: { id: 'feedback-id', type: 'nps' },
        error: null,
      })),
    })),
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('POST /api/widget/feedback', () => {
  const mockRequest = (body: unknown, headers?: Record<string, string>) => {
    return new NextRequest('http://localhost/api/widget/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-api-key',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CORS Validation - AC-02', () => {
    it('should reject requests from unauthorized domains when allowed_domains is set', async () => {
      // Mock project with allowed domains
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'test-api-key',
              allowed_domains: ['example.com', 'trusted.org'],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = mockRequest(
        {
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        },
        { origin: 'https://malicious.com' }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Domain not authorized');
    });

    it('should allow requests from authorized domains', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'test-api-key',
              allowed_domains: ['example.com'],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = mockRequest(
        {
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        },
        { origin: 'https://example.com' }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should allow subdomains of authorized domains', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'test-api-key',
              allowed_domains: ['example.com'],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = mockRequest(
        {
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        },
        { origin: 'https://sub.example.com' }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should allow requests when allowed_domains is empty', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'test-api-key',
              allowed_domains: [],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = mockRequest(
        {
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        },
        { origin: 'https://any-domain.com' }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should check referer header when origin is not present', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'test-api-key',
              allowed_domains: ['example.com'],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/widget/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key',
          'Referer': 'https://example.com/page',
        },
        body: JSON.stringify({
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should reject when referer is from unauthorized domain', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'test-api-key',
              allowed_domains: ['example.com'],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/widget/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key',
          'Referer': 'https://malicious.com/page',
        },
        body: JSON.stringify({
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Domain not authorized');
    });

    it('should include CORS headers in error response', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'test-api-key',
              allowed_domains: ['example.com'],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = mockRequest(
        {
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        },
        { origin: 'https://malicious.com' }
      );

      const response = await POST(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('API Key Validation', () => {
    it('should reject requests without API key', async () => {
      const request = new NextRequest('http://localhost/api/widget/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('API Key is required');
    });

    it('should reject requests with invalid API key', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project',
              api_key: 'correct-api-key',
              allowed_domains: [],
              feedbacks_count: 0,
              max_feedbacks: 100,
            },
            error: null,
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/widget/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'wrong-api-key',
        },
        body: JSON.stringify({
          project_id: 'test-project',
          type: 'nps',
          nps_score: 9,
          content: 'Great product!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid API Key');
    });
  });

  describe('OPTIONS Handler', () => {
    it('should return 204 for preflight requests', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
    });
  });
});
