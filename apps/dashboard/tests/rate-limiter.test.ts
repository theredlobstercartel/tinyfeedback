import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter, getAnonymousId, clearAnonymousId } from '../lib/rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkLimit', () => {
    it('returns allowed when no previous attempts exist', () => {
      const result = RateLimiter.checkLimit()
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4) // MAX_ATTEMPTS - 1
    })

    it('returns not allowed when max attempts reached', () => {
      // Simulate 5 attempts
      for (let i = 0; i < 5; i++) {
        RateLimiter.recordAttempt()
      }
      
      const result = RateLimiter.checkLimit()
      
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('resets after window period', () => {
      // Simulate 5 attempts
      for (let i = 0; i < 5; i++) {
        RateLimiter.recordAttempt()
      }
      
      // Fast forward past the window
      vi.advanceTimersByTime(61 * 1000)
      
      const result = RateLimiter.checkLimit()
      expect(result.allowed).toBe(true)
    })

    it('calculates remaining attempts correctly', () => {
      RateLimiter.recordAttempt()
      RateLimiter.recordAttempt()
      
      const result = RateLimiter.checkLimit()
      
      expect(result.remaining).toBe(3) // 5 - 2
    })
  })

  describe('recordAttempt', () => {
    it('increments attempt count', () => {
      RateLimiter.recordAttempt()
      
      const result = RateLimiter.checkLimit()
      expect(result.remaining).toBe(4)
    })

    it('stores state in localStorage', () => {
      RateLimiter.recordAttempt()
      
      const stored = localStorage.getItem('tf_rate_limit')
      expect(stored).not.toBeNull()
      
      const parsed = JSON.parse(stored!)
      expect(parsed.count).toBe(1)
      expect(parsed.firstAttempt).toBeTypeOf('number')
    })
  })

  describe('reset', () => {
    it('clears rate limit state', () => {
      RateLimiter.recordAttempt()
      RateLimiter.reset()
      
      const stored = localStorage.getItem('tf_rate_limit')
      expect(stored).toBeNull()
    })
  })
})

describe('Anonymous ID', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getAnonymousId', () => {
    it('generates new ID when none exists', () => {
      const id = getAnonymousId()
      
      expect(id).toMatch(/^anon_[a-z0-9]+_[a-z0-9]+$/)
    })

    it('returns existing ID when one exists', () => {
      const firstId = getAnonymousId()
      const secondId = getAnonymousId()
      
      expect(firstId).toBe(secondId)
    })

    it('stores ID in localStorage', () => {
      const id = getAnonymousId()
      
      expect(localStorage.getItem('tf_anonymous_id')).toBe(id)
    })
  })

  describe('clearAnonymousId', () => {
    it('removes ID from localStorage', () => {
      getAnonymousId()
      clearAnonymousId()
      
      expect(localStorage.getItem('tf_anonymous_id')).toBeNull()
    })
  })
})
