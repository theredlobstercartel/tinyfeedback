import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FeedbackForm } from '../components/feedback-form'
import { submitFeedback } from '../lib/feedback-service'
import { RateLimiter } from '../lib/rate-limiter'
import { FeedbackType, FeedbackCategory } from '../types/feedback'

// Mock dependencies
vi.mock('../lib/feedback-service')
vi.mock('../lib/rate-limiter')

describe('FeedbackForm', () => {
  const mockApiKey = 'tf_test123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(RateLimiter.checkLimit).mockReturnValue({
      allowed: true,
      remaining: 5,
      resetInMs: 60000,
    })
  })

  describe('Rendering', () => {
    it('renders all feedback type tabs', () => {
      render(<FeedbackForm apiKey={mockApiKey} />)
      
      expect(screen.getByRole('tab', { name: /nps/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /sugestão/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /bug/i })).toBeInTheDocument()
    })

    it('renders suggestion form by default', () => {
      render(<FeedbackForm apiKey={mockApiKey} />)
      
      expect(screen.getByRole('tabpanel', { name: /sugestão/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument()
    })

    it('renders NPS form when type is NPS', () => {
      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.NPS} />)
      
      expect(screen.getByRole('tabpanel', { name: /nps/i })).toBeInTheDocument()
      expect(screen.getByRole('radiogroup', { name: /nps score/i })).toBeInTheDocument()
    })
  })

  describe('Type Switching', () => {
    it('switches to NPS form when NPS tab is clicked', () => {
      render(<FeedbackForm apiKey={mockApiKey} />)
      
      fireEvent.click(screen.getByRole('tab', { name: /nps/i }))
      
      expect(screen.getByRole('tabpanel', { name: /nps/i })).toBeInTheDocument()
    })

    it('switches to Bug form when Bug tab is clicked', () => {
      render(<FeedbackForm apiKey={mockApiKey} />)
      
      fireEvent.click(screen.getByRole('tab', { name: /bug/i }))
      
      expect(screen.getByRole('tabpanel', { name: /bug/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/incluir informações técnicas/i)).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('shows validation error for NPS without score', async () => {
      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.NPS} />)
      
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/nota deve estar entre 0 e 10/i)
      })
    })

    it('shows validation error for suggestion without title', async () => {
      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.SUGGESTION} />)
      
      const descriptionInput = screen.getByLabelText(/descrição/i)
      fireEvent.change(descriptionInput, { target: { value: 'This is a valid description with enough characters' } })
      
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/título deve ter pelo menos/i)
      })
    })

    it('shows validation error for suggestion with short description', async () => {
      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.SUGGESTION} />)
      
      const titleInput = screen.getByLabelText(/título/i)
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } })
      
      const descriptionInput = screen.getByLabelText(/descrição/i)
      fireEvent.change(descriptionInput, { target: { value: 'Short' } })
      
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/descrição deve ter pelo menos/i)
      })
    })

    it('shows validation error for bug with short description', async () => {
      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.BUG} />)
      
      const descriptionInput = screen.getByLabelText(/descreva o problema/i)
      fireEvent.change(descriptionInput, { target: { value: 'Short' } })
      
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/descrição deve ter pelo menos/i)
      })
    })

    it('shows validation error for invalid email', async () => {
      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.BUG} />)
      
      const emailInput = screen.getByLabelText(/email para contato/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/email inválido/i)
      })
    })
  })

  describe('Anonymous Mode', () => {
    it('hides name and email fields when anonymous is checked', () => {
      render(<FeedbackForm apiKey={mockApiKey} />)
      
      expect(screen.getByLabelText(/seu nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/seu email/i)).toBeInTheDocument()
      
      fireEvent.click(screen.getByLabelText(/enviar anonimamente/i))
      
      expect(screen.queryByLabelText(/seu nome/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/seu email/i)).not.toBeInTheDocument()
    })
  })

  describe('Submission', () => {
    it('submits NPS feedback successfully', async () => {
      vi.mocked(submitFeedback).mockResolvedValue({
        success: true,
        id: 'fb-123',
      })

      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.NPS} />)
      
      fireEvent.click(screen.getByRole('radio', { name: /9 - promotor/i }))
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(submitFeedback).toHaveBeenCalledWith(expect.objectContaining({
          apiKey: mockApiKey,
          data: expect.objectContaining({
            type: FeedbackType.NPS,
            score: 9,
          }),
        }))
      })
    })

    it('submits suggestion feedback successfully', async () => {
      vi.mocked(submitFeedback).mockResolvedValue({
        success: true,
        id: 'fb-456',
      })

      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.SUGGESTION} />)
      
      fireEvent.change(screen.getByLabelText(/título/i), {
        target: { value: 'Add dark mode' },
      })
      fireEvent.change(screen.getByLabelText(/descrição/i), {
        target: { value: 'Would love to have dark mode support in the application' },
      })
      
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(submitFeedback).toHaveBeenCalledWith(expect.objectContaining({
          apiKey: mockApiKey,
          data: expect.objectContaining({
            type: FeedbackType.SUGGESTION,
            title: 'Add dark mode',
            description: 'Would love to have dark mode support in the application',
            category: FeedbackCategory.FEATURE,
          }),
        }))
      })
    })

    it('calls onSuccess callback after successful submission', async () => {
      const onSuccess = vi.fn()
      vi.mocked(submitFeedback).mockResolvedValue({
        success: true,
        id: 'fb-123',
      })

      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.NPS} onSuccess={onSuccess} />)
      
      fireEvent.click(screen.getByRole('radio', { name: /10 - promotor/i }))
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows error message when submission fails', async () => {
      vi.mocked(submitFeedback).mockResolvedValue({
        success: false,
        error: 'Erro de conexão',
      })

      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.NPS} />)
      
      fireEvent.click(screen.getByRole('radio', { name: /8 - neutro/i }))
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/erro de conexão/i)
      })
    })

    it('calls onError callback when submission fails', async () => {
      const onError = vi.fn()
      vi.mocked(submitFeedback).mockResolvedValue({
        success: false,
        error: 'Erro de conexão',
      })

      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.NPS} onError={onError} />)
      
      fireEvent.click(screen.getByRole('radio', { name: /8 - neutro/i }))
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Erro de conexão')
      })
    })
  })

  describe('Rate Limiting', () => {
    it('disables submit button when rate limited', () => {
      vi.mocked(RateLimiter.checkLimit).mockReturnValue({
        allowed: false,
        remaining: 0,
        resetInMs: 30000,
      })

      render(<FeedbackForm apiKey={mockApiKey} />)
      
      const submitButton = screen.getByRole('button')
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent(/aguarde/i)
    })

    it('shows rate limit warning when few attempts remain', () => {
      vi.mocked(RateLimiter.checkLimit).mockReturnValue({
        allowed: true,
        remaining: 2,
        resetInMs: 60000,
      })

      render(<FeedbackForm apiKey={mockApiKey} />)
      
      expect(screen.getByText(/atenção: 2 tentativas restantes/i)).toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('shows success message after submission', async () => {
      vi.mocked(submitFeedback).mockResolvedValue({
        success: true,
        id: 'fb-123',
      })

      render(<FeedbackForm apiKey={mockApiKey} type={FeedbackType.NPS} />)
      
      fireEvent.click(screen.getByRole('radio', { name: /10 - promotor/i }))
      fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/obrigado pelo seu feedback/i)
      })
    })
  })
})
