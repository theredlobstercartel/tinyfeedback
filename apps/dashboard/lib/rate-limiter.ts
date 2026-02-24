import { RateLimitState } from '../types/feedback'

const RATE_LIMIT_KEY = 'tf_rate_limit'
const MAX_ATTEMPTS = 5
const WINDOW_MS = 60 * 1000 // 1 minute
const STORAGE_KEY = 'tf_anonymous_id'

export class RateLimiter {
  private static getState(): RateLimitState | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    if (!stored) return null
    
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  private static setState(state: RateLimitState): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state))
  }

  static checkLimit(): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now()
    const state = this.getState()

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

  static recordAttempt(): void {
    const now = Date.now()
    const state = this.getState()

    if (!state || now - state.firstAttempt > WINDOW_MS) {
      // Start new window
      this.setState({
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      })
    } else {
      // Increment existing window
      this.setState({
        count: state.count + 1,
        firstAttempt: state.firstAttempt,
        lastAttempt: now,
      })
    }
  }

  static reset(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(RATE_LIMIT_KEY)
  }
}

export function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = `anon_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function clearAnonymousId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
