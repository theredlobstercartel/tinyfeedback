import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/stripe/webhook/route';
import * as stripeLib from '@/lib/stripe';

// Mock the stripe library
vi.mock('@/lib/stripe', () => ({
  verifyWebhookSignature: vi.fn(),
  processWebhookEvent: vi.fn(),
}));

describe('Stripe Webhook API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
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

  describe('POST', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: '{}',
      });
      
      const response = await POST(request as unknown as import('next/server').NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing stripe-signature header');
    });

    it('should return 400 when signature verification fails', async () => {
      vi.mocked(stripeLib.verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      
      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'stripe-signature': 'invalid_signature',
        },
      });
      
      const response = await POST(request as unknown as import('next/server').NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid webhook signature');
    });

    it('should process payment_intent.succeeded event', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
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
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });
      
      const response = await POST(request as unknown as import('next/server').NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('activate_pro');
    });

    it('should process payment_intent.payment_failed event', async () => {
      const mockEvent = {
        id: 'evt_456',
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_456' } },
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
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });
      
      const response = await POST(request as unknown as import('next/server').NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('payment_failed');
    });

    it('should process customer.subscription.deleted event', async () => {
      const mockEvent = {
        id: 'evt_789',
        type: 'customer.subscription.deleted',
        data: { object: { id: 'sub_789' } },
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
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'valid_signature',
        },
      });
      
      const response = await POST(request as unknown as import('next/server').NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('downgrade_free');
    });

    it('should return 500 on unexpected errors', async () => {
      vi.mocked(stripeLib.verifyWebhookSignature).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const request = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: '{}',
        headers: {
          'stripe-signature': 'signature',
        },
      });
      
      const response = await POST(request as unknown as import('next/server').NextRequest);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
