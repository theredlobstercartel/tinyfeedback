import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './middleware';

// Mock do @supabase/ssr
const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: any[]) => mockCreateServerClient(...args),
}));

describe('Middleware - Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });
  });

  const createMockRequest = (pathname: string): NextRequest => {
    const url = new URL(`http://localhost:3000${pathname}`);
    return {
      nextUrl: {
        pathname: url.pathname,
        clone: () => new URL(`http://localhost:3000${pathname}`),
      },
      url: url.toString(),
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    } as unknown as NextRequest;
  };

  describe('AC-01: Redirecionamento para não logados', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    });

    it('should redirect to /login when accessing /dashboard without authentication', async () => {
      const request = createMockRequest('/dashboard');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should redirect to /login when accessing /settings without authentication', async () => {
      const request = createMockRequest('/settings');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should redirect to /login when accessing /projects/* without authentication', async () => {
      const request = createMockRequest('/projects/my-project');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should redirect to /login when accessing /projects without authentication', async () => {
      const request = createMockRequest('/projects');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('should allow access to /login when not authenticated', async () => {
      const request = createMockRequest('/login');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('should allow access to public pages when not authenticated', async () => {
      const request = createMockRequest('/');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });
  });

  describe('AC-02: Acesso permitido para usuários logados', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    it('should allow access to /dashboard when authenticated', async () => {
      const request = createMockRequest('/dashboard');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('should allow access to /settings when authenticated', async () => {
      const request = createMockRequest('/settings');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('should allow access to /projects/* when authenticated', async () => {
      const request = createMockRequest('/projects/my-project');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });

    it('should allow access to /projects when authenticated', async () => {
      const request = createMockRequest('/projects');
      const response = await updateSession(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Redirecionamento de /login quando autenticado', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    it('should redirect to /dashboard when accessing /login while authenticated', async () => {
      const request = createMockRequest('/login');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('should redirect to /dashboard when accessing /auth/callback while authenticated', async () => {
      const request = createMockRequest('/auth/callback');
      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('AC-03: Persistência de sessão', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    it('should maintain user session across requests', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      // First request
      const request1 = createMockRequest('/dashboard');
      const response1 = await updateSession(request1);
      expect(response1.status).toBe(200);

      // Second request - session should still be valid
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      const request2 = createMockRequest('/settings');
      const response2 = await updateSession(request2);
      expect(response2.status).toBe(200);

      // Third request - still valid
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      const request3 = createMockRequest('/projects/test');
      const response3 = await updateSession(request3);
      expect(response3.status).toBe(200);
    });
  });
});
