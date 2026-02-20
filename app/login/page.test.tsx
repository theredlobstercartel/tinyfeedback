import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders login form with email input', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('TinyFeedback')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('founder@startup.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
  });

  it('shows error for empty email', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Por favor, insira seu email')).toBeInTheDocument();
    });
  });

  it('shows rate limit error when localStorage indicates rate limit exceeded', async () => {
    // Mock rate limit exceeded
    const rateLimitEntry = {
      count: 5,
      timestamp: Date.now(),
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitEntry));

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('founder@startup.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const submitButton = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Muitas tentativas/)).toBeInTheDocument();
    });
  });

  it('displays helper text about magic links', () => {
    render(<LoginPage />);
    
    expect(screen.getByText(/Não precisa de senha/)).toBeInTheDocument();
    expect(screen.getByText(/links mágicos seguros/)).toBeInTheDocument();
  });
});
