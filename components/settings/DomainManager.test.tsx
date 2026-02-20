import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DomainManager } from './DomainManager';

// Mock fetch
global.fetch = vi.fn();

describe('DomainManager', () => {
  const mockFetch = fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          allowed_domains: ['example.com'],
        },
      }),
    });
  });

  // AC-01: Adicionar domínio
  it('should add a domain when clicking add button', async () => {
    render(<DomainManager projectId="test-project" initialDomains={[]} />);
    
    const input = screen.getByPlaceholderText('exemplo.com');
    const addButton = screen.getByText('Adicionar');
    
    fireEvent.change(input, { target: { value: 'example.com' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/test-project/domains',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'add', domain: 'example.com' }),
        })
      );
    });
  });

  it('should add domain when pressing Enter', async () => {
    render(<DomainManager projectId="test-project" initialDomains={[]} />);
    
    const input = screen.getByPlaceholderText('exemplo.com');
    
    fireEvent.change(input, { target: { value: 'example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/test-project/domains',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'add', domain: 'example.com' }),
        })
      );
    });
  });

  // AC-02: Remover domínio
  it('should show remove button for each domain', () => {
    render(
      <DomainManager 
        projectId="test-project" 
        initialDomains={['example.com', 'test.com']} 
      />
    );
    
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('test.com')).toBeInTheDocument();
    
    const removeButtons = screen.getAllByLabelText(/Remover/);
    expect(removeButtons).toHaveLength(2);
  });

  it('should call API when removing a domain', async () => {
    render(
      <DomainManager 
        projectId="test-project" 
        initialDomains={['example.com']} 
      />
    );
    
    const removeButton = screen.getByLabelText('Remover example.com');
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/test-project/domains',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'remove', domain: 'example.com' }),
        })
      );
    });
  });

  // AC-03: Validação
  it('should show error for invalid domain with protocol', async () => {
    render(<DomainManager projectId="test-project" initialDomains={[]} />);
    
    const input = screen.getByPlaceholderText('exemplo.com');
    const addButton = screen.getByText('Adicionar');
    
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/protocolo/)).toBeInTheDocument();
    });
    
    // Should not call API
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should show empty state when no domains', () => {
    render(<DomainManager projectId="test-project" initialDomains={[]} />);
    
    expect(screen.getByText('Nenhum domínio configurado')).toBeInTheDocument();
  });

  it('should show error for duplicate domain', async () => {
    render(
      <DomainManager 
        projectId="test-project" 
        initialDomains={['example.com']} 
      />
    );
    
    const input = screen.getByPlaceholderText('exemplo.com');
    const addButton = screen.getByText('Adicionar');
    
    fireEvent.change(input, { target: { value: 'example.com' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/já existe/)).toBeInTheDocument();
    });
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should show empty state when no domains', () => {
    render(<DomainManager projectId="test-project" initialDomains={[]} />);
    
    expect(screen.getByText('Nenhum domínio configurado')).toBeInTheDocument();
  });

  it('should normalize domain to lowercase', async () => {
    render(<DomainManager projectId="test-project" initialDomains={[]} />);
    
    const input = screen.getByPlaceholderText('exemplo.com');
    const addButton = screen.getByText('Adicionar');
    
    fireEvent.change(input, { target: { value: 'EXAMPLE.COM' } });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ action: 'add', domain: 'example.com' }),
        })
      );
    });
  });
});
