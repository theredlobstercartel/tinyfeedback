import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  verifyWebhookSignature, 
  processWebhookEvent,
  activateProPlan,
  downgradeToFree,
  handlePaymentFailed 
} from '@/lib/stripe';
import * as supabaseLib from '@/lib/supabase';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn(),
      },
    })),
  };
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(),
}));

describe('Stripe Library', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    };
    
    vi.mocked(supabaseLib.createAdminClient).mockReturnValue(mockSupabase);
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature successfully', () => {
      const mockEvent = { id: 'evt_123', type: 'payment_intent.succeeded' };
      const mockStripe = new Stripe('test_key', { apiVersion: '2026-01-28.clover' });
      
      vi.mocked(mockStripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);
      
      const result = verifyWebhookSignature('payload', 'signature', 'secret');
      
      expect(result).toEqual(mockEvent);
    });

    it('should throw error for invalid signature', () => {
      const mockStripe = new Stripe('test_key', { apiVersion: '2026-01-28.clover' });
      
      vi.mocked(mockStripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      
      expect(() => verifyWebhookSignature('payload', 'invalid', 'secret')).toThrow(
        'Webhook signature verification failed'
      );
    });
  });

  describe('processWebhookEvent', () => {
    it('should handle payment_intent.succeeded event', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'proj_123', name: 'Test Project' },
        error: null,
      });
      mockSupabase.eq.mockResolvedValue({ error: null });
      
      const event = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            customer: 'cus_123',
          },
        },
      };
      
      const result = await processWebhookEvent(event as any);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('activate_pro');
    });

    it('should handle payment_intent.payment_failed event', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'proj_456', name: 'Test Project' },
        error: null,
      });
      mockSupabase.eq.mockResolvedValue({ error: null });
      
      const event = {
        id: 'evt_456',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_456',
            customer: 'cus_456',
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      };
      
      const result = await processWebhookEvent(event as any);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('payment_failed');
    });

    it('should handle customer.subscription.deleted event', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'proj_789', name: 'Test Project' },
        error: null,
      });
      mockSupabase.eq.mockResolvedValue({ error: null });
      
      const event = {
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
      
      const result = await processWebhookEvent(event as any);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('downgrade_free');
    });

    it('should handle customer.subscription.updated event with active status', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'proj_abc', name: 'Test Project' },
        error: null,
      });
      mockSupabase.eq.mockResolvedValue({ error: null });
      
      const event = {
        id: 'evt_abc',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_abc',
            customer: 'cus_abc',
            status: 'active',
            current_period_end: 1706745600,
          },
        },
      };
      
      const result = await processWebhookEvent(event as any);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('activate_pro');
    });

    it('should handle unhandled event types', async () => {
      const event = {
        id: 'evt_xyz',
        type: 'invoice.created',
        data: { object: {} },
      };
      
      const result = await processWebhookEvent(event as any);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('unhandled');
    });

    it('should throw error when project not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      
      const event = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            customer: 'cus_unknown',
          },
        },
      };
      
      await expect(processWebhookEvent(event as any)).rejects.toThrow(
        'Project not found for customer'
      );
    });

    it('should throw error when payment intent missing customer', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            customer: null,
          },
        },
      };
      
      await expect(processWebhookEvent(event as any)).rejects.toThrow(
        'Payment intent missing customer ID'
      );
    });
  });
});
