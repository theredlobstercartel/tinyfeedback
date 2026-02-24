'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle, AlertCircle, Send, MessageSquare, Bug, Lightbulb } from 'lucide-react'
import { cn } from '../../lib/utils'
import { submitFeedback } from '../../lib/feedback-service'
import { RateLimiter } from '../../lib/rate-limiter'
import {
  feedbackFormSchema,
  FeedbackFormData,
  UserInfoData,
  FeedbackType,
  FeedbackCategory,
  SubmitFeedbackResponse,
} from '../../types/feedback'
import { NPSRating, StarRating } from './rating'
import { AutoResizeTextarea } from './auto-resize-textarea'

interface FeedbackFormProps {
  apiKey: string
  type?: FeedbackTypeType
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

type FeedbackTypeType = typeof FeedbackType[keyof typeof FeedbackType]
type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export function FeedbackForm({
  apiKey,
  type = FeedbackType.SUGGESTION,
  onSuccess,
  onError,
  className,
}: FeedbackFormProps) {
  const [activeType, setActiveType] = useState<FeedbackTypeType>(type)
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [submitResult, setSubmitResult] = useState<SubmitFeedbackResponse | null>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData & UserInfoData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: activeType,
      score: -1,
      title: '',
      description: '',
      category: FeedbackCategory.FEATURE,
      includeTechnicalInfo: true,
      contactEmail: '',
      name: '',
      email: '',
      isAnonymous: false,
    },
    mode: 'onChange',
  })

  const isAnonymous = watch('isAnonymous')
  const rateLimit = typeof window !== 'undefined' ? RateLimiter.checkLimit() : { allowed: true, remaining: 5 }

  const onSubmit = async (data: FeedbackFormData & UserInfoData) => {
    setFormStatus('submitting')

    const userInfo: UserInfoData = {
      name: data.name,
      email: data.email,
      isAnonymous: data.isAnonymous,
    }

    const result = await submitFeedback({
      apiKey,
      data,
      userInfo,
    })

    setSubmitResult(result)

    if (result.success) {
      setFormStatus('success')
      onSuccess?.()
      
      // Reset form after 3 seconds
      setTimeout(() => {
        reset()
        setFormStatus('idle')
        setSubmitResult(null)
      }, 3000)
    } else {
      setFormStatus('error')
      onError?.(result.error || 'Erro desconhecido')
    }
  }

  const handleTypeChange = (newType: FeedbackTypeType) => {
    setActiveType(newType)
    setValue('type', newType)
  }

  const typeButtons = [
    { type: FeedbackType.NPS, label: 'NPS', icon: MessageSquare },
    { type: FeedbackType.SUGGESTION, label: 'Sugestão', icon: Lightbulb },
    { type: FeedbackType.BUG, label: 'Bug', icon: Bug },
  ]

  // Success state
  if (formStatus === 'success') {
    return (
      <div className={cn('p-6 text-center', className)} role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Obrigado pelo seu feedback!</h3>
          <p className="text-sm text-gray-600">
            Sua opinião é muito importante para nós.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-6 p-4', className)}
      aria-label="Formulário de feedback"
    >
      {/* Type Selector */}
      <div className="flex gap-2" role="tablist" aria-label="Tipo de feedback">
        {typeButtons.map(({ type: btnType, label, icon: Icon }) => (
          <button
            key={btnType}
            type="button"
            role="tab"
            aria-selected={activeType === btnType}
            onClick={() => handleTypeChange(btnType)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              activeType === btnType
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* NPS Form */}
      {activeType === FeedbackType.NPS && (
        <div className="space-y-4" role="tabpanel" aria-label="NPS">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Como você avalia nosso produto?
              <span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
              name="score"
              control={control}
              render={({ field }) => (
                <NPSRating
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.score?.message}
                />
              )}
            />
          </div>

          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <AutoResizeTextarea
                label="Comentário (opcional)"
                placeholder="Conte-nos mais sobre sua experiência..."
                value={field.value || ''}
                onChange={field.onChange}
                maxLength={500}
                error={errors.comment?.message}
              />
            )}
          />
        </div>
      )}

      {/* Suggestion Form */}
      {activeType === FeedbackType.SUGGESTION && (
        <div className="space-y-4" role="tabpanel" aria-label="Sugestão">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              {...register('category')}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'border-gray-300 hover:border-gray-400'
              )}
            >
              <option value={FeedbackCategory.FEATURE}>Nova funcionalidade</option>
              <option value={FeedbackCategory.BUG}>Correção de bug</option>
              <option value={FeedbackCategory.OTHER}>Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="Resuma sua sugestão em poucas palavras"
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.title
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 hover:border-gray-400'
              )}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1" role="alert">{errors.title.message}</p>
            )}
          </div>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <AutoResizeTextarea
                label="Descrição"
                placeholder="Descreva sua sugestão em detalhes..."
                value={field.value || ''}
                onChange={field.onChange}
                minRows={4}
                maxLength={2000}
                error={errors.description?.message}
                required
              />
            )}
          />
        </div>
      )}

      {/* Bug Form */}
      {activeType === FeedbackType.BUG && (
        <div className="space-y-4" role="tabpanel" aria-label="Bug">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <AutoResizeTextarea
                label="Descreva o problema"
                placeholder="O que aconteceu? O que você esperava que acontecesse?"
                value={field.value || ''}
                onChange={field.onChange}
                minRows={4}
                maxLength={2000}
                error={errors.description?.message}
                required
              />
            )}
          />

          <div className="flex items-center gap-2">
            <input
              {...register('includeTechnicalInfo')}
              type="checkbox"
              id="includeTechnicalInfo"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeTechnicalInfo" className="text-sm text-gray-700">
              Incluir informações técnicas (navegador, OS, URL)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email para contato (opcional)
            </label>
            <input
              {...register('contactEmail')}
              type="email"
              placeholder="seu@email.com"
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.contactEmail
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 hover:border-gray-400'
              )}
            />
            {errors.contactEmail && (
              <p className="text-sm text-red-500 mt-1" role="alert">{errors.contactEmail.message}</p>
            )}
          </div>
        </div>
      )}

      {/* User Info Section (Optional Anonymity) */}
      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center gap-2">
          <input
            {...register('isAnonymous')}
            type="checkbox"
            id="isAnonymous"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isAnonymous" className="text-sm text-gray-700">
            Enviar anonimamente
          </label>
        </div>

        {!isAnonymous && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seu nome
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="João Silva"
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.name
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1" role="alert">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seu email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="joao@exemplo.com"
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1" role="alert">{errors.email.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {formStatus === 'error' && submitResult?.error && (
        <div
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitResult.error}</span>
        </div>
      )}

      {/* Rate Limit Warning */}
      {rateLimit.remaining <= 2 && rateLimit.remaining > 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          Atenção: {rateLimit.remaining} tentativa{rateLimit.remaining !== 1 ? 's' : ''} restante{rateLimit.remaining !== 1 ? 's' : ''}.
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={formStatus === 'submitting' || !rateLimit.allowed}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          formStatus === 'submitting' || !rateLimit.allowed
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
        )}
      >
        {formStatus === 'submitting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : !rateLimit.allowed ? (
          <>
            <AlertCircle className="w-4 h-4" />
            Aguarde {Math.ceil(rateLimit.resetInMs / 1000)}s
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar Feedback
          </>
        )}
      </button>
    </form>
  )
}
