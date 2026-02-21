// Types for Stripe Webhook events

export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: Record<string, unknown>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: StripeWebhookEventType;
}

export type StripeWebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.subscription.deleted'
  | 'customer.subscription.updated'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed';

export interface PaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  amount_received: number;
  client_secret: string | null;
  confirmation_method: 'automatic' | 'manual';
  created: number;
  currency: string;
  customer: string | null;
  description: string | null;
  last_payment_error: {
    message: string;
    code: string;
  } | null;
  metadata: Record<string, string>;
  next_action: unknown;
  payment_method: string | null;
  receipt_email: string | null;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  charges?: {
    data: Array<{
      id: string;
      receipt_url: string | null;
    }>;
  };
}

export interface Subscription {
  id: string;
  object: 'subscription';
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  created: number;
  current_period_end: number;
  current_period_start: number;
  customer: string;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
    }>;
  };
  metadata: Record<string, string>;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
}

export type SubscriptionStatus = 'free' | 'pro' | 'enterprise';

export interface SubscriptionUpdateInput {
  plan: SubscriptionStatus;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  subscription_status?: string;
  current_period_end?: string | null;
  updated_at: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  action?: string;
  projectId?: string;
}