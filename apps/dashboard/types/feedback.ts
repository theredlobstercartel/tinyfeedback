import { z } from 'zod'

export const FeedbackCategory = {
  BUG: 'bug',
  FEATURE: 'feature',
  OTHER: 'other',
} as const

export type FeedbackCategoryType = typeof FeedbackCategory[keyof typeof FeedbackCategory]

export const FeedbackType = {
  NPS: 'nps',
  SUGGESTION: 'suggestion',
  BUG: 'bug',
} as const

export type FeedbackTypeType = typeof FeedbackType[keyof typeof FeedbackType]

// NPS Feedback Schema (0-10 scale)
export const npsFeedbackSchema = z.object({
  type: z.literal('nps'),
  score: z.number().min(0).max(10, 'A nota deve estar entre 0 e 10'),
  comment: z.string().max(500, 'Comentário deve ter no máximo 500 caracteres').optional(),
})

// Suggestion Feedback Schema
export const suggestionFeedbackSchema = z.object({
  type: z.literal('suggestion'),
  title: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  category: z.enum([FeedbackCategory.BUG, FeedbackCategory.FEATURE, FeedbackCategory.OTHER]),
})

// Bug Feedback Schema
export const bugFeedbackSchema = z.object({
  type: z.literal('bug'),
  description: z.string()
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  includeTechnicalInfo: z.boolean().default(true),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
})

// User info schema (optional anonymity)
export const userInfoSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  isAnonymous: z.boolean().default(false),
})

// Combined feedback schema
export const feedbackFormSchema = z.discriminatedUnion('type', [
  npsFeedbackSchema,
  suggestionFeedbackSchema,
  bugFeedbackSchema,
])

export type NPSFeedbackData = z.infer<typeof npsFeedbackSchema>
export type SuggestionFeedbackData = z.infer<typeof suggestionFeedbackSchema>
export type BugFeedbackData = z.infer<typeof bugFeedbackSchema>
export type UserInfoData = z.infer<typeof userInfoSchema>
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>

// API Response types
export interface SubmitFeedbackResponse {
  success: boolean
  id?: string
  error?: string
  rateLimited?: boolean
  quotaExceeded?: boolean
}

// Rate limiter types
export interface RateLimitState {
  count: number
  firstAttempt: number
  lastAttempt: number
}
