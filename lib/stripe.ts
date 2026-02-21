import Stripe from 'stripe';

// Allow build without STRIPE_SECRET_KEY - it will be set at runtime
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null;
