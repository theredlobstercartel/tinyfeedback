/**
 * Feedback Form Widget - Multi-step Form Implementation
 * ST-13: Formulário de Sugestões e Bugs
 * 
 * Features:
 * - Multi-step form: type → details → upload → confirmation
 * - Vanilla JS validation (no external dependencies)
 * - Screenshot upload to Supabase Storage
 * - Rate limiting per IP
 * - XSS sanitization
 * - Unique ticket ID generation
 */

// ============================================================================
// Types & Enums
// ============================================================================

export type FeedbackType = 'suggestion' | 'bug' | 'other'

export interface FeedbackFormData {
  type: FeedbackType
  title: string
  description: string
  email?: string
  screenshot?: File
  metadata: FeedbackMetadata
}

export interface FeedbackMetadata {
  url: string
  userAgent: string
  timestamp: string
  referrer: string
  viewport: {
    width: number
    height: number
  }
}

export interface SubmitFeedbackResult {
  success: boolean
  ticketId?: string
  error?: string
  rateLimited?: boolean
}

export type FormStep = 'type' | 'details' | 'upload' | 'confirmation'

// ============================================================================
// Validation Functions (Vanilla JS - no Zod dependency)
// ============================================================================

interface ValidationError {
  field: string
  message: string
}

export function validateTypeStep(type?: FeedbackType): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!type || !['suggestion', 'bug', 'other'].includes(type)) {
    errors.push({ field: 'type', message: 'Por favor, selecione um tipo de feedback' })
  }
  
  return errors
}

export function validateDetailsStep(
  title?: string,
  description?: string,
  email?: string
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Title validation
  if (!title || title.trim().length < 5) {
    errors.push({ field: 'title', message: 'O título deve ter pelo menos 5 caracteres' })
  } else if (title.length > 100) {
    errors.push({ field: 'title', message: 'O título deve ter no máximo 100 caracteres' })
  } else if (title.trim().length < 5) {
    errors.push({ field: 'title', message: 'O título não pode conter apenas espaços em branco' })
  }
  
  // Description validation
  if (!description || description.trim().length < 20) {
    errors.push({ field: 'description', message: 'A descrição deve ter pelo menos 20 caracteres' })
  } else if (description.length > 2000) {
    errors.push({ field: 'description', message: 'A descrição deve ter no máximo 2000 caracteres' })
  } else if (description.trim().length < 20) {
    errors.push({ field: 'description', message: 'A descrição não pode conter apenas espaços em branco' })
  }
  
  // Email validation (optional)
  if (email && email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Por favor, insira um email válido' })
    }
  }
  
  return errors
}

export function validateUploadStep(file?: File): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (file) {
    // Size validation (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      errors.push({ field: 'screenshot', message: 'O arquivo deve ter no máximo 2MB' })
    }
    
    // Type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      errors.push({ field: 'screenshot', message: 'Apenas arquivos JPG e PNG são permitidos' })
    }
  }
  
  return errors
}

export function validateStep(
  step: FormStep,
  data: Partial<FeedbackFormData>
): Record<string, string> {
  let errors: ValidationError[] = []
  
  switch (step) {
    case 'type':
      errors = validateTypeStep(data.type)
      break
    case 'details':
      errors = validateDetailsStep(data.title, data.description, data.email)
      break
    case 'upload':
      errors = validateUploadStep(data.screenshot)
      break
  }
  
  // Convert to record
  return errors.reduce((acc, err) => {
    acc[err.field] = err.message
    return acc
  }, {} as Record<string, string>)
}

export function canProceed(step: FormStep, data: Partial<FeedbackFormData>): boolean {
  const errors = validateStep(step, data)
  return Object.keys(errors).length === 0
}

// ============================================================================
// XSS Sanitization
// ============================================================================

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function sanitizeFeedbackData(data: FeedbackFormData): FeedbackFormData {
  return {
    ...data,
    title: escapeHtml(data.title),
    description: escapeHtml(data.description),
    email: data.email ? escapeHtml(data.email) : undefined,
  }
}

// ============================================================================
// Ticket ID Generation
// ============================================================================

export function generateTicketId(): string {
  const prefix = 'TF'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// ============================================================================
// Metadata Collection
// ============================================================================

export function collectMetadata(): FeedbackMetadata {
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
// Rate Limiting (Client-side with localStorage)
// ============================================================================

const RATE_LIMIT_KEY = 'tf_feedback_rate_limit'
const MAX_ATTEMPTS = 3
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes

interface RateLimitState {
  count: number
  firstAttempt: number
  lastAttempt: number
}

function getRateLimitState(): RateLimitState | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(RATE_LIMIT_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function setRateLimitState(state: RateLimitState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state))
}

export function checkRateLimit(): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  const state = getRateLimitState()

  if (!state) {
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInMs: WINDOW_MS }
  }

  // Reset if window has passed
  if (now - state.firstAttempt > WINDOW_MS) {
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInMs: WINDOW_MS }
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - state.count)
  const resetInMs = WINDOW_MS - (now - state.firstAttempt)

  return {
    allowed: state.count < MAX_ATTEMPTS,
    remaining,
    resetInMs,
  }
}

export function recordFeedbackAttempt(): void {
  const now = Date.now()
  const state = getRateLimitState()

  if (!state || now - state.firstAttempt > WINDOW_MS) {
    setRateLimitState({
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    })
  } else {
    setRateLimitState({
      count: state.count + 1,
      firstAttempt: state.firstAttempt,
      lastAttempt: now,
    })
  }
}

// ============================================================================
// API Integration
// ============================================================================

export interface FeedbackApiConfig {
  apiKey: string
  apiUrl: string
  supabaseUrl?: string
  supabaseAnonKey?: string
}

async function uploadScreenshot(
  file: File,
  ticketId: string,
  config: FeedbackApiConfig
): Promise<string | null> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn('Supabase config not provided, skipping screenshot upload')
    return null
  }

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${ticketId}.${fileExt}`
    const filePath = `feedback-screenshots/${fileName}`

    // Create FormData for upload
    const formData = new FormData()
    formData.append('file', file)

    // Upload to Supabase Storage via REST API
    const uploadUrl = `${config.supabaseUrl}/storage/v1/object/feedback-screenshots/${filePath}`
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    // Return the public URL
    return `${config.supabaseUrl}/storage/v1/object/public/feedback-screenshots/${filePath}`
  } catch (error) {
    console.error('Error uploading screenshot:', error)
    return null
  }
}

export async function submitFeedback(
  data: FeedbackFormData,
  config: FeedbackApiConfig
): Promise<SubmitFeedbackResult> {
  // Check rate limit first
  const rateLimit = checkRateLimit()
  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.resetInMs / 60000)
    return {
      success: false,
      rateLimited: true,
      error: `Limite de envios atingido. Tente novamente em ${minutes} minutos.`,
    }
  }

  // Generate ticket ID
  const ticketId = generateTicketId()

  try {
    // Upload screenshot if provided
    let screenshotUrl: string | null = null
    if (data.screenshot) {
      screenshotUrl = await uploadScreenshot(data.screenshot, ticketId, config)
    }

    // Sanitize data
    const sanitizedData = sanitizeFeedbackData(data)

    // Prepare payload
    const payload = {
      type: sanitizedData.type === 'other' ? 'suggestion' : sanitizedData.type,
      content: {
        ticketId,
        title: sanitizedData.title,
        description: sanitizedData.description,
        category: sanitizedData.type,
        screenshotUrl,
        metadata: sanitizedData.metadata,
      },
      userEmail: sanitizedData.email,
      anonymousId: `anon_${Math.random().toString(36).substring(2, 15)}`,
      technicalContext: {
        url: sanitizedData.metadata.url,
        userAgent: sanitizedData.metadata.userAgent,
        viewport: sanitizedData.metadata.viewport,
        referrer: sanitizedData.metadata.referrer,
      },
    }

    // Submit to API
    const response = await fetch(`${config.apiUrl}/api/v1/feedbacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (response.status === 429) {
      return {
        success: false,
        rateLimited: true,
        error: 'Limite de requisições atingido. Tente novamente mais tarde.',
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    // Record successful attempt
    recordFeedbackAttempt()

    return {
      success: true,
      ticketId,
    }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao enviar feedback',
    }
  }
}

// ============================================================================
// Form State Management
// ============================================================================

export interface FormState {
  step: FormStep
  data: Partial<FeedbackFormData>
  errors: Record<string, string>
  isSubmitting: boolean
  ticketId?: string
}

export const initialFormState: FormState = {
  step: 'type',
  data: {},
  errors: {},
  isSubmitting: false,
}
