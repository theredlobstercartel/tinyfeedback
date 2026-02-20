import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyDisplay } from './ApiKeyDisplay';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('ApiKeyDisplay', () => {
  const mockApiKey = 'tf_live_abcdefghijklmnopqrstuvwx';
  const mockProjectName = 'My Test Project';

  it('should render API key section', () => {
    render(
      <ApiKeyDisplay apiKey={mockApiKey} projectName={mockProjectName} />
    );

    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(
      screen.getByText('Use esta chave para integrar o widget no seu site')
    ).toBeInTheDocument();
  });

  it('should display masked API key by default', () => {
    render(
      <ApiKeyDisplay apiKey={mockApiKey} projectName={mockProjectName} />
    );

    const input = screen.getByDisplayValue('tf_live_abcd••••••••••••••••••••');
    expect(input).toBeInTheDocument();
  });

  it('should toggle API key visibility', () => {
    render(
      <ApiKeyDisplay apiKey={mockApiKey} projectName={mockProjectName} />
    );

    // Initially masked
    expect(
      screen.getByDisplayValue('tf_live_abcd••••••••••••••••••••')
    ).toBeInTheDocument();

    // Click to show
    const toggleButton = screen.getByTitle('Mostrar chave');
    fireEvent.click(toggleButton);

    // Should show full key
    expect(
      screen.getByDisplayValue(mockApiKey)
    ).toBeInTheDocument();
  });

  it('should copy API key to clipboard', async () => {
    render(
      <ApiKeyDisplay apiKey={mockApiKey} projectName={mockProjectName} />
    );

    const copyButton = screen.getByText('Copiar');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockApiKey);
    });

    expect(screen.getByText('Copiado!')).toBeInTheDocument();
  });

  it('should show project name in label', () => {
    render(
      <ApiKeyDisplay apiKey={mockApiKey} projectName={mockProjectName} />
    );

    expect(
      screen.getByText(`Chave de API para ${mockProjectName}`)
    ).toBeInTheDocument();
  });

  it('should display installation code', () => {
    render(
      <ApiKeyDisplay apiKey={mockApiKey} projectName={mockProjectName} />
    );

    expect(screen.getByText('Código de instalação')).toBeInTheDocument();
    expect(screen.getByText(/TinyFeedback.init/)).toBeInTheDocument();
  });
});
