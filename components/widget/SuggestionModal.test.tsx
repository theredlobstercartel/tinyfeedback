import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SuggestionModal } from './SuggestionModal';

// Mock fetch
global.fetch = vi.fn();

describe('SuggestionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const projectId = 'test-project-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByRole('heading', { name: 'Enviar Sugestão' })).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: 'Enviar Sugestão' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição/)).toBeInTheDocument();
  });

  it('should show validation error when title is empty', async () => {
    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Enviar Sugestão/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório')).toBeInTheDocument();
    });
  });

  it('should show validation error when title is too short', async () => {
    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/Título/);
    fireEvent.change(titleInput, { target: { value: 'ab' } });

    const submitButton = screen.getByRole('button', { name: /Enviar Sugestão/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Título deve ter pelo menos 3 caracteres')).toBeInTheDocument();
    });
  });

  it('should call API with correct data when form is valid', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'feedback-123' } }),
    } as Response);

    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/Título/);
    const descriptionInput = screen.getByLabelText(/Descrição/);
    const submitButton = screen.getByRole('button', { name: /Enviar Sugestão/i });

    fireEvent.change(titleInput, { target: { value: 'Nova Feature' } });
    fireEvent.change(descriptionInput, { target: { value: 'Descrição da feature' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/widget/feedback',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"type":"suggestion"'),
        })
      );
    });

    // Verify request body contains correct data
    const callArgs = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1]?.body as string);
    
    expect(requestBody).toMatchObject({
      project_id: projectId,
      type: 'suggestion',
      title: 'Nova Feature',
      content: 'Descrição da feature',
    });
  });

  it('should handle API error', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Erro no servidor' }),
    } as Response);

    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/Título/);
    fireEvent.change(titleInput, { target: { value: 'Título Válido' } });

    const submitButton = screen.getByRole('button', { name: /Enviar Sugestão/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Erro no servidor')).toBeInTheDocument();
    });
  });

  it('should close modal when clicking close button', () => {
    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByLabelText('Fechar');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should send suggestion without description (optional field)', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'feedback-123' } }),
    } as Response);

    render(
      <SuggestionModal
        projectId={projectId}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const titleInput = screen.getByLabelText(/Título/);
    fireEvent.change(titleInput, { target: { value: 'Título da Sugestão' } });

    const submitButton = screen.getByRole('button', { name: /Enviar Sugestão/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      expect(requestBody.content).toBe('No description provided');
    });
  });
});
