import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock('@/lib/utils/api-key', () => ({
  generateApiKey: vi.fn(() => 'tf_live_abcdefghijklmnopqrstuvwx'),
}));

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: object): NextRequest => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe('AC-01: Formulário de criação - Validação', () => {
    it('should return 400 if name is missing', async () => {
      const request = createMockRequest({ description: 'Test description' });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Nome do projeto é obrigatório');
    });

    it('should return 400 if name is empty string', async () => {
      const request = createMockRequest({ name: '   ' });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Nome do projeto é obrigatório');
    });

    it('should return 400 if name is too short', async () => {
      const request = createMockRequest({ name: 'ab' });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Nome do projeto deve ter pelo menos 3 caracteres');
    });

    it('should return 400 if name is too long', async () => {
      const request = createMockRequest({ name: 'a'.repeat(101) });
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Nome do projeto deve ter no máximo 100 caracteres');
    });
  });
});

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of projects', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1', slug: 'project-1' },
      { id: '2', name: 'Project 2', slug: 'project-2' },
    ];

    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
      })),
    });

    const request = {} as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toEqual(mockProjects);
  });
});
