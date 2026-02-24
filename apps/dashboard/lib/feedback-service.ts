import {
  FeedbackFormData,
  UserInfoData,
  SubmitFeedbackResponse,
  FeedbackType,
} from '../types/feedback'
import { getTechnicalContext, sanitizeInput } from './utils'
import { RateLimiter, getAnonymousId } from './rate-limiter'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface SubmitFeedbackOptions {
  apiKey: string
  data: FeedbackFormData
  userInfo?: UserInfoData
}

export async function submitFeedback({
  apiKey,
  data,
  userInfo,
}: SubmitFeedbackOptions): Promise<SubmitFeedbackResponse> {
  // Check rate limit
  const rateLimit = RateLimiter.checkLimit()
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Muitas tentativas. Aguarde ${Math.ceil(rateLimit.resetInMs / 1000)} segundos.`,
      rateLimited: true,
    }
  }

  // Prepare content based on type
  let content: Record<string, unknown> = {}
  
  switch (data.type) {
    case FeedbackType.NPS:
      content = {
        score: data.score,
        comment: data.comment ? sanitizeInput(data.comment) : undefined,
      }
      break
    case FeedbackType.SUGGESTION:
      content = {
        title: sanitizeInput(data.title),
        description: sanitizeInput(data.description),
        category: data.category,
      }
      break
    case FeedbackType.BUG:
      content = {
        description: sanitizeInput(data.description),
        includeTechnicalInfo: data.includeTechnicalInfo,
        contactEmail: data.contactEmail || undefined,
      }
      break
  }

  // Build payload
  const payload: Record<string, unknown> = {
    type: data.type,
    content,
  }

  // Add user info if not anonymous
  if (!userInfo?.isAnonymous) {
    if (userInfo?.name) {
      payload.userName = userInfo.name
    }
    if (userInfo?.email) {
      payload.userEmail = userInfo.email
    }
  }

  // Add anonymous ID
  payload.anonymousId = getAnonymousId()

  // Add technical context for bugs
  if (data.type === FeedbackType.BUG && (data as { includeTechnicalInfo?: boolean }).includeTechnicalInfo !== false) {
    payload.technicalContext = getTechnicalContext()
  }

  try {
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    // Record attempt on success or client error (not server error or rate limit)
    if (response.ok || response.status === 400) {
      RateLimiter.recordAttempt()
    }

    if (response.status === 429) {
      return {
        success: false,
        error: 'Limite de requisições excedido. Tente novamente mais tarde.',
        rateLimited: true,
      }
    }

    if (response.status === 403) {
      return {
        success: false,
        error: 'API Key inválida ou domínio não autorizado.',
      }
    }

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao enviar feedback. Tente novamente.',
      }
    }

    return {
      success: true,
      id: result.id,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro de conexão. Verifique sua internet e tente novamente.',
    }
  }
}
