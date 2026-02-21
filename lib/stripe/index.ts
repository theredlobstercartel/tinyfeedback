import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
  typescript: true,
});

// Client-side Stripe promise
export const getStripe = () => {
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
  return loadStripe(stripePublishableKey);
};

// Price IDs from environment variables
export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO!,
};

// Plan configuration
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    maxFeedbacks: 100,
    features: [
      'Até 100 feedbacks/mês',
      'Widget personalizável',
      '1 projeto',
      'Suporte por email',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: STRIPE_PRICE_IDS.pro,
    maxFeedbacks: null, // Unlimited
    features: [
      'Feedbacks ilimitados',
      'Widget personalizável',
      'Projetos ilimitados',
      'Suporte prioritário',
      'Notas internas',
      'API completa',
    ],
  },
};
