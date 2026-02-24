import { describe, it, expect } from 'vitest'
import { generateAnonymousId, sanitizeInput, getTechnicalContext } from '../lib/utils'

describe('Utils', () => {
  describe('generateAnonymousId', () => {
    it('generates unique IDs', () => {
      const id1 = generateAnonymousId()
      const id2 = generateAnonymousId()
      
      expect(id1).not.toBe(id2)
    })

    it('generates ID with correct prefix', () => {
      const id = generateAnonymousId()
      
      expect(id).toMatch(/^anon_/)
    })
  })

  describe('sanitizeInput', () => {
    it('removes HTML tags', () => {
      const input = '<script>alert("xss")</script>'
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).toBe('alert("xss")')
    })

    it('trims whitespace', () => {
      const input = '  hello world  '
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).toBe('hello world')
    })

    it('handles empty string', () => {
      const sanitized = sanitizeInput('')
      
      expect(sanitized).toBe('')
    })
  })

  describe('getTechnicalContext', () => {
    it('returns null when window is undefined', () => {
      // Simulate server-side environment
      const originalWindow = global.window
      // @ts-expect-error - Testing server-side
      global.window = undefined
      
      const context = getTechnicalContext()
      
      expect(context).toBeNull()
      
      global.window = originalWindow
    })

    it('returns context object in browser', () => {
      const context = getTechnicalContext()
      
      expect(context).toHaveProperty('url')
      expect(context).toHaveProperty('userAgent')
      expect(context).toHaveProperty('viewport')
      expect(context).toHaveProperty('timestamp')
      expect(context).toHaveProperty('referrer')
    })
  })
})
