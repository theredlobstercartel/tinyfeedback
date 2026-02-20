import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { NextRequest } from 'next/server';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-project-id',
              allowed_domains: ['existing.com'],
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-project-id',
                allowed_domains: ['existing.com', 'newdomain.com'],
              },
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}));

describe('PATCH /api/projects/[id]/domains', () => {
  const mockRequest = (body: unknown) => {
    return new NextRequest('http://localhost/api/projects/test-project-id/domains', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-01: Adicionar domínio
  it('should add a valid domain to the whitelist', async () => {
    const request = mockRequest({
      action: 'add',
      domain: 'newdomain.com',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-project-id' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.allowed_domains).toContain('newdomain.com');
  });

  // AC-02: Remover domínio
  it('should remove a domain from the whitelist', async () => {
    const request = mockRequest({
      action: 'remove',
      domain: 'existing.com',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-project-id' }) });
    
    expect(response.status).toBe(200);
  });

  // AC-03: Validação
  it('should reject invalid domain format', async () => {
    const request = mockRequest({
      action: 'add',
      domain: 'https://invalid.com/path',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-project-id' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('protocolo');
  });

  it('should reject duplicate domains', async () => {
    const request = mockRequest({
      action: 'add',
      domain: 'existing.com',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-project-id' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('já existe');
  });

  it('should reject empty domain', async () => {
    const request = mockRequest({
      action: 'add',
      domain: '',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-project-id' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Domínio é obrigatório');
  });

  it('should reject invalid action', async () => {
    const request = mockRequest({
      action: 'invalid',
      domain: 'example.com',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-project-id' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Ação inválida. Use "add" ou "remove"');
  });

  it('should handle missing domain parameter', async () => {
    const request = mockRequest({
      action: 'add',
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-project-id' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Domínio é obrigatório');
  });
});
