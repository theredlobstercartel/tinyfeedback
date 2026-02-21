import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the stripe module - must be at top level without variables
vi.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Import after mocks
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { GET } from '../route';
import { POST } from '../cancel/route';

describe('Subscription API', () => {
  const mockSupabaseSelect = vi.fn();
  const mockSupabaseEq = vi.fn();
  const mockSupabaseSingle = vi.fn();
  const mockSupabaseUpdate = vi.fn();
  const mockSupabaseFrom = vi.fn();
  const mockSupabaseGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';

    // Setup supabase mock
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect.mockReturnThis(),
        eq: mockSupabaseEq.mockReturnThis(),
        single: mockSupabaseSingle,
        update: mockSupabaseUpdate.mockReturnThis(),
      }),
      auth: {
        getUser: mockSupabaseGetUser,
      },
    });
  });

  describe('GET /api/subscription', () => {
    it('should return 401 if no authorization header', async () => {
      const request = new NextRequest('http://localhost/api/subscription');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Não autorizado');
    });

    it('should return 401 if invalid token', async () => {
      mockSupabaseGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = new NextRequest('http://localhost/api/subscription', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Token inválido');
    });

    it('should return free plan when no stripe subscription', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseSingle.mockResolvedValue({
        data: {
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan: 'free',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/subscription', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription).toBeDefined();
      expect(data.subscription.planName).toBe('Free');
      expect(data.subscription.amount).toBe(0);
    });

    it('should return stripe subscription when exists', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseSingle.mockResolvedValue({
        data: {
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          plan: 'pro',
        },
        error: null,
      });

      (stripe!.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        current_period_start: 1704067200,
        current_period_end: 1706745600,
        cancel_at_period_end: false,
        canceled_at: null,
        customer: 'cus_123',
        items: {
          data: [{
            price: {
              unit_amount: 2900,
              currency: 'brl',
              recurring: { interval: 'month' },
              product: {
                id: 'prod_123',
                name: 'Pro',
              },
            },
          }],
        },
      });

      const request = new NextRequest('http://localhost/api/subscription', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription).toBeDefined();
      expect(data.subscription.planName).toBe('Pro');
      expect(data.subscription.amount).toBe(29); // converted from cents
      expect(data.subscription.currency).toBe('brl');
    });
  });

  describe('POST /api/subscription/cancel', () => {
    it('should return 401 if no authorization header', async () => {
      const request = new NextRequest('http://localhost/api/subscription/cancel', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Não autorizado');
    });

    it('should return 404 if no subscription found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseSingle.mockResolvedValue({
        data: {
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan: 'free',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/subscription/cancel', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Assinatura não encontrada');
    });

    it('should cancel subscription successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseSingle.mockResolvedValue({
        data: {
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          plan: 'pro',
        },
        error: null,
      });

      (stripe!.subscriptions.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'sub_123',
        cancel_at_period_end: true,
        current_period_end: 1706745600,
      });

      mockSupabaseUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const request = new NextRequest('http://localhost/api/subscription/cancel', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.cancelAtPeriodEnd).toBe(true);
      expect(stripe!.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      });
    });
  });
});
