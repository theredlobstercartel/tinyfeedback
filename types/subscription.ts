export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
  planName: string;
  planId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  customerId: string;
  subscriptionId: string;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  error?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  error?: string;
}

export type PlanType = 'free' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string | null;
}

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Para projetos pessoais',
    price: 0,
    interval: 'month',
    features: [
      'Até 100 feedbacks/mês',
      'Widget básico',
      '1 projeto',
      'Suporte por email',
    ],
    stripePriceId: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para founders',
    price: 29,
    interval: 'month',
    features: [
      'Feedbacks ilimitados',
      'Widget customizável',
      'Projetos ilimitados',
      'API completa',
      'Suporte prioritário',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || null,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para empresas',
    price: 99,
    interval: 'month',
    features: [
      'Tudo do Pro',
      'SLA garantido',
      'Onboarding personalizado',
      'Suporte 24/7',
      'SSO/SAML',
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || null,
  },
};
