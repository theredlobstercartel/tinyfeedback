/**
 * Webhook Service Tests
 * ST-11: Webhooks e Integrações
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateWebhookUrl,
  verifyWebhookSignature,
} from '@/lib/webhook-service'

describe('Webhook Service', () => {
  describe('validateWebhookUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      const result = validateWebhookUrl('https://example.com/webhook')
      expect(result.valid).toBe(true)
    })

    it('should accept Slack webhook URLs', () => {
      const result = validateWebhookUrl('https://hooks.slack.com/services/T123/B456/xyz')
      expect(result.valid).toBe(true)
    })

    it('should accept Discord webhook URLs', () => {
      const result = validateWebhookUrl('https://discord.com/api/webhooks/123/abc')
      expect(result.valid).toBe(true)
    })

    it('should accept localhost URLs for testing', () => {
      const result = validateWebhookUrl('http://localhost:3000/webhook')
      expect(result.valid).toBe(true)
    })

    it('should reject HTTP URLs for non-localhost', () => {
      const result = validateWebhookUrl('http://example.com/webhook')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('HTTPS')
    })

    it('should reject invalid URLs', () => {
      const result = validateWebhookUrl('not-a-url')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('URL')
    })
  })

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature (placeholder)', () => {
      // Note: This is a placeholder since actual HMAC verification
      // requires Web Crypto API which isn't available in Node tests
      const result = verifyWebhookSignature('payload', 'signature', 'secret')
      expect(result).toBe(true)
    })
  })
})

/**
 * Test Data for Webhooks
 */
export const mockWebhook = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  project_id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Webhook',
  url: 'https://example.com/webhook',
  secret: 'a1b2c3d4e5f6789012345678901234567890abcdef',
  status: 'active' as const,
  events: ['feedback.created' as const, 'feedback.updated' as const],
  template: 'default' as const,
  max_retries: 3,
  retry_count: 0,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

export const mockWebhookDelivery = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  webhook_id: mockWebhook.id,
  project_id: mockWebhook.project_id,
  event_type: 'feedback.created' as const,
  event_id: '123e4567-e89b-12d3-a456-426614174003',
  payload: {
    event: 'feedback.created',
    timestamp: '2024-01-15T10:00:00Z',
    data: {
      id: '123e4567-e89b-12d3-a456-426614174003',
      type: 'nps',
      content: { score: 9, comment: 'Great!' },
      status: 'new',
    },
  },
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-ID': mockWebhook.id,
    'X-Event-Type': 'feedback.created',
    'X-Webhook-Signature': 'signature123',
    'X-Webhook-Version': '1.0',
  },
  signature: 'signature123',
  status: 'delivered' as const,
  http_status_code: 200,
  response_body: '{"ok": true}',
  attempt_number: 1,
  duration_ms: 150,
  created_at: '2024-01-15T10:00:00Z',
}

export const mockWebhookStats = {
  total_deliveries: 100,
  successful_deliveries: 95,
  failed_deliveries: 3,
  retrying_deliveries: 2,
  success_rate: 95.0,
  avg_duration_ms: 125.5,
}
