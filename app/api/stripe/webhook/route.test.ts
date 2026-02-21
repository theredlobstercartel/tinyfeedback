import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import * as stripeLib from '@/lib/stripe';

// Mock the stripe library
vi.mock('@/lib/stripe', () => ({
  verifyWebhookSignature: vi.fn(),
  processWebhookEvent: vi.fn(),
}));

describe('Stripe Webhook API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  describe('POST', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: 'test-payload',
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing stripe-signature');
    });

    it('should return 400 when signature verification fails', async () => {
      vi.mocked(stripeLib.verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'invalid-sig' },
        body: 'test-payload',
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });

    it('should process payment_intent.succeeded event', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123', customer: 'cus_123' } },
      };

      vi.mocked(stripeLib.verifyWebhookSignature).mockReturnValue(mockEvent as any);
      vi.mocked(stripeLib.processWebhookEvent).mockResolvedValue({
        success: true,
        message: 'Pro plan activated successfully',
        action: 'activate_pro',
        projectId: 'proj_123',
      });

      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid-sig' },
        body: 'test-payload',
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('activate_pro');
      expect(data.projectId).toBe('proj_123');
    });

    it('should process payment_intent.payment_failed event', async () => {
      const mockEvent = {
        id: 'evt_456',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_456',
            customer: 'cus_456',
            last_payment_error: { message: 'Card declined' },
          },
        },
      };

      vi.mocked(stripeLib.verifyWebhookSignature).mockReturnValue(mockEvent as any);
      vi.mocked(stripeLib.processWebhookEvent).mockResolvedValue({
        success: true,
        message: 'Payment failure recorded, founder notified',
        action: 'payment_failed',
        projectId: 'proj_456',
      });

      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid-sig' },
        body: 'test-payload',
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe('payment_failed');
    });

    it('should process customer.subscription.deleted event', async () => {
      const mockEvent = {
        id: 'evt_789',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_789',
            customer: 'cus_789',
            cancel_at_period_end: false,
          },
        },
      };

      vi.mocked(stripeLib.verifyWebhookSignature).mockReturnValue(mockEvent as any);
      vi.mocked(stripeLib.processWebhookEvent).mockResolvedValue({
        success: true,
        message: 'Downgraded to Free plan successfully',
        action: 'downgrade_free',
        projectId: 'proj_789',
      });

      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid-sig' },
        body: 'test-payload',
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe('downgrade_free');
    });

    it('should return 500 when processing fails', async () => {
      const mockEvent = {
        id: 'evt_abc',
        type: 'payment_intent.succeeded',
        data: { object: {} },
      };

      vi.mocked(stripeLib.verifyWebhookSignature).mockReturnValue(mockEvent as any);
      vi.mocked(stripeLib.processWebhookEvent).mockRejectedValue(
        new Error('Database error')
      );

      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid-sig' },
        body: 'test-payload',
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET', () => {
    it('should return health check response', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.endpoint).toBe('/api/stripe/webhook');
    });
  });
});