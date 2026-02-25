/**
 * Multi-Step Feedback Form Component
 * ST-13: Formulário de Sugestões e Bugs
 * 
 * Features:
 * - Multi-step form with type selection, details, upload, and confirmation
 * - Zod validation
 * - Screenshot upload
 * - Ticket ID generation
 */

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { z } from 'zod'
import {
  Lightbulb,
  Bug,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  CheckCircle,
  Copy,
  Loader2,
  Ticket,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'
import { Label } from './label'

// ============================================================================
// Types & Schemas
// ============================================================================

export type FeedbackFormType = 'suggestion' | 'bug' | 'other'

export const feedbackTypeSchema = z.object({
  type: z.enum(['suggestion', 'bug', 'other'], {
    required_error: 'Selecione um tipo de feedback',
  }),
})

export const feedbackDetailsSchema = z.object({
  title: z
    .string()
    .min(5, 'O título deve ter pelo menos 5 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .min(20, 'A descrição deve ter pelo menos 20 caracteres')
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
})

export const feedbackUploadSchema = z.object({
  screenshot: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 2 * 1024 * 1024,
      'O arquivo deve ter no máximo 2MB'
    )
    .refine(
      (file) =>
        !file || ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
      'Apenas arquivos JPG e PNG são permitidos'
    ),
})

export const multiStepFeedbackSchema = feedbackTypeSchema
  .merge(feedbackDetailsSchema)
  .merge(feedbackUploadSchema)

export type MultiStepFeedbackData = z.infer<typeof multiStepFeedbackSchema>

export interface FeedbackMetadata {
  url: string
  userAgent: string
  timestamp: string
  referrer: string
  viewport: { width: number; height: number }
}

export interface SubmitResult {
  success: boolean
  ticketId?: string
  error?: string
  rateLimited?: boolean
}

type FormStep = 'type' | 'details' | 'upload' | 'confirmation'

// ============================================================================
// Utility Functions
// ============================================================================

function generateTicketId(): string {
  const prefix = 'TF'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

function collectMetadata(): FeedbackMetadata {
  if (typeof window === 'undefined') {
    return {
      url: '',
      userAgent: '',
      timestamp: new Date().toISOString(),
      referrer: '',
      viewport: { width: 0, height: 0 },
    }
  }

  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    referrer: document.referrer,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  }
}

// ============================================================================
// Form Components
// ============================================================================

interface MultiStepFeedbackFormProps {
  apiKey: string
  apiUrl: string
  onClose?: () => void
  onSubmit?: (result: SubmitResult) => void
  className?: string
}

export function MultiStepFeedbackForm({
  apiKey,
  apiUrl,
  onClose,
  onSubmit,
  className,
}: MultiStepFeedbackFormProps) {
  const [step, setStep] = useState<FormStep>('type')
  const [formData, setFormData] = useState<Partial<MultiStepFeedbackData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketId, setTicketId] = useState<string>('')
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const steps: FormStep[] = ['type', 'details', 'upload', 'confirmation']
  const currentStepIndex = steps.indexOf(step)

  const validateStep = useCallback((currentStep: FormStep, data: Partial<MultiStepFeedbackData>) => {
    try {
      switch (currentStep) {
        case 'type':
          feedbackTypeSchema.parse({ type: data.type })
          return {}
        case 'details':
          feedbackDetailsSchema.parse({
            title: data.title,
            description: data.description,
            email: data.email,
          })
          return {}
        case 'upload':
          feedbackUploadSchema.parse({ screenshot: data.screenshot })
          return {}
        default:
          return {}
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
        return fieldErrors
      }
      return {}
    }
  }, [])

  const canProceed = useCallback(() => {
    const stepErrors = validateStep(step, formData)
    return Object.keys(stepErrors).length === 0
  }, [step, formData, validateStep])

  const handleNext = () => {
    const stepErrors = validateStep(step, formData)
    setErrors(stepErrors)

    if (Object.keys(stepErrors).length > 0) return

    if (step === 'upload') {
      handleSubmit()
    } else {
      setStep(steps[currentStepIndex + 1])
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1])
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const newTicketId = generateTicketId()
      const metadata = collectMetadata()

      // Upload screenshot if present
      let screenshotUrl: string | null = null
      if (formData.screenshot) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', formData.screenshot)
        formDataUpload.append('ticketId', newTicketId)

        try {
          const uploadRes = await fetch('/api/upload-screenshot', {
            method: 'POST',
            body: formDataUpload,
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            screenshotUrl = uploadData.url
          }
        } catch (e) {
          console.error('Screenshot upload failed:', e)
        }
      }

      // Submit feedback
      const payload = {
        type: formData.type === 'other' ? 'suggestion' : formData.type,
        content: {
          ticketId: newTicketId,
          title: formData.title,
          description: formData.description,
          category: formData.type,
          screenshotUrl,
          metadata,
        },
        userEmail: formData.email,
        anonymousId: `anon_${Math.random().toString(36).substring(2, 15)}`,
        technicalContext: metadata,
      }

      const response = await fetch(`${apiUrl}/api/v1/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setTicketId(newTicketId)
        setStep('confirmation')
        onSubmit?.({ success: true, ticketId: newTicketId })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setErrors({ submit: errorData.message || 'Erro ao enviar feedback' })
        onSubmit?.({ success: false, error: errorData.message })
      }
    } catch (error) {
      setErrors({ submit: 'Erro ao enviar feedback' })
      onSubmit?.({ success: false, error: 'Erro ao enviar feedback' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Dropzone for screenshot upload
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          setErrors({ screenshot: 'O arquivo deve ter no máximo 2MB' })
          return
        }
        setFormData((prev) => ({ ...prev, screenshot: file }))
        const reader = new FileReader()
        reader.onload = () => setScreenshotPreview(reader.result as string)
        reader.readAsDataURL(file)
        setErrors({})
      }
    },
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
  })

  // ============================================================================
  // Step Renderers
  // ============================================================================

  const renderTypeStep = () => {
    const types = [
      {
        id: 'suggestion' as const,
        label: 'Sugestão',
        icon: Lightbulb,
        description: 'Ideias para melhorar o produto',
      },
      {
        id: 'bug' as const,
        label: 'Bug',
        icon: Bug,
        description: 'Reportar um problema',
      },
      {
        id: 'other' as const,
        label: 'Outro',
        icon: HelpCircle,
        description: 'Outros tipos de feedback',
      },
    ]

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Que tipo de feedback você quer enviar?
        </h3>
        <div className="grid gap-3">
          {types.map((type) => {
            const Icon = type.icon
            const isSelected = formData.type === type.id
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, type: type.id }))
                  setErrors({})
                }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </button>
            )
          })}
        </div>
        {errors.type && (
          <p className="text-sm text-red-500" role="alert">{errors.type}</p>
        )}
      </div>
    )
  }

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Detalhes do feedback</h3>

      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, title: e.target.value }))
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
          }}
          placeholder="Um título curto para seu feedback"
          maxLength={100}
          className={errors.title ? 'border-red-500' : ''}
        />
        <div className="flex justify-between">
          {errors.title ? (
            <p className="text-sm text-red-500" role="alert">{errors.title}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-500">
            {(formData.title || '').length}/100
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Descrição <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, description: e.target.value }))
            if (errors.description) setErrors((prev) => ({ ...prev, description: '' }))
          }}
          placeholder="Descreva em detalhes..."
          rows={5}
          maxLength={2000}
          className={errors.description ? 'border-red-500' : ''}
        />
        <div className="flex justify-between">
          {errors.description ? (
            <p className="text-sm text-red-500" role="alert">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-500">
            {(formData.description || '').length}/2000
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (opcional)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, email: e.target.value }))
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
          }}
          placeholder="seu@email.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500" role="alert">{errors.email}</p>
        )}
        <p className="text-xs text-gray-500">
          Para receber atualizações sobre seu feedback
        </p>
      </div>
    </div>
  )

  const renderUploadStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Adicionar screenshot (opcional)</h3>
      <p className="text-gray-600">Ajude-nos a entender melhor com uma imagem</p>

      {screenshotPreview ? (
        <div className="relative">
          <img
            src={screenshotPreview}
            alt="Preview"
            className="w-full rounded-lg border"
          />
          <button
            type="button"
            onClick={() => {
              setFormData((prev) => ({ ...prev, screenshot: undefined }))
              setScreenshotPreview(null)
            }}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 font-medium">
            {isDragActive ? 'Solte aqui' : 'Clique ou arraste uma imagem'}
          </p>
          <p className="text-sm text-gray-500">JPG ou PNG, máx. 2MB</p>
        </div>
      )}

      {errors.screenshot && (
        <p className="text-sm text-red-500" role="alert">{errors.screenshot}</p>
      )}

      <button
        type="button"
        onClick={() => setStep('confirmation')}
        className="text-gray-500 hover:text-gray-700 text-sm"
      >
        Pular esta etapa
      </button>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6 py-4">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900">
          Feedback enviado com sucesso!
        </h3>
        <p className="text-gray-600 mt-2">
          Obrigado por nos ajudar a melhorar.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Ticket className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-600">Número do ticket</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <code className="text-2xl font-bold text-gray-900 tracking-wider">{ticketId}</code>
          <button
            type="button"
            onClick={handleCopyTicket}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
              copied
                ? 'bg-green-500 text-white'
                : 'bg-white border hover:bg-gray-50'
            )}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Guarde este número para acompanhar o status
        </p>
      </div>

      <Button onClick={onClose} className="w-full">Fechar</Button>
    </div>
  )

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Step Indicator */}
      {step !== 'confirmation' && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps
            .filter((s) => s !== 'confirmation')
            .map((s, i) => {
              const stepIndex = steps.indexOf(step)
              const isActive = i === stepIndex
              const isCompleted = i < stepIndex

              return (
                <div
                  key={s}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    isActive && 'bg-blue-500 text-white',
                    isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-gray-400'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs',
                      isActive && 'bg-white text-blue-500',
                      isCompleted && 'bg-green-100',
                      !isActive && !isCompleted && 'bg-gray-100'
                    )}
                  >
                    {isCompleted ? <CheckCircle className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">
                    {s === 'type' && 'Tipo'}
                    {s === 'details' && 'Detalhes'}
                    {s === 'upload' && 'Anexo'}
                  </span>
                </div>
              )
            })}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white rounded-xl border p-6">
        {step === 'type' && renderTypeStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'upload' && renderUploadStep()}
        {step === 'confirmation' && renderConfirmationStep()}

        {/* Navigation */}
        {step !== 'confirmation' && (
          <div className="flex gap-3 mt-6">
            {currentStepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            ) : (
              <div className="flex-1" />
            )}

            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : step === 'upload' ? (
                'Enviar'
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
            role="alert"
          >
            {errors.submit}
          </div>
        )}
      </div>
    </div>
  )
}

export default MultiStepFeedbackForm
