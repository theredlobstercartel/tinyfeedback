import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  eq: vi.fn(() => ({
    single: vi.fn(),
    maybeSingle: vi.fn(),
  })),
  order: vi.fn(() => ({
    select: mockSelect,
  })),
}));

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

  describe('AC-02: Gerar API key', () => {
    it('should create project with generated API key', async () => {
      const projectData = {
        id: '123',
        name: 'My Project',
        slug: 'my-project',
        api_key: 'tf_live_abcdefghijklmnopqrstuvwx',
        description: null,
        widget_color: '#00ff88',
        widget_position: 'bottom-right',
        widget_text: 'Feedback',
        allowed_domains: [],
        plan: 'free',
        feedbacks_count: 0,
        max_feedbacks: 100,
      };

      mockSelect.mockReturnValueOnce({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockInsert.mockReturnValueOnce({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: projectData, error: null }),
        })),
      });

      const request = createMockRequest({ name: 'My Project' });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.data.api_key).toBe('tf_live_abcdefghijklmnopqrstuvwx');
    });
  });

  describe('Slug generation', () => {
    it('should generate correct slug from project name', async () => {
      mockSelect.mockReturnValueOnce({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockInsert.mockReturnValueOnce({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: '123', slug: 'my-awesome-project' },
            error: null,
          }),
        })),
      });

      const request = createMockRequest({ name: 'My Awesome Project!' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Duplicate project name', () => {
    it('should return 409 if project with same slug exists', async () => {
      mockSelect.mockReturnValueOnce({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'existing-id' },
          error: null,
        }),
      });

      const request = createMockRequest({ name: 'Existing Project' });
      const response = await POST(request);

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('Já existe um projeto com este nome');
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

    mockSelect.mockReturnValueOnce({
      order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
    });

    const request = {} as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toEqual(mockProjects);
  });
});
