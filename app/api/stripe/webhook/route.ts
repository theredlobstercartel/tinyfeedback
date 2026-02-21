import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, processWebhookEvent } from '@/lib/stripe';
import type { StripeWebhookEvent } from '@/types';

// Stripe webhook secret from environment
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * POST handler for Stripe webhooks
 * Receives webhook events from Stripe and processes them
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the raw body for signature verification
    const payload = await request.text();
    
    // Get Stripe signature from headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }
    
    if (!WEBHOOK_SECRET) {
      console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // Verify webhook signature
    let event: StripeWebhookEvent;
    try {
      event = verifyWebhookSignature(payload, signature, WEBHOOK_SECRET);
    } catch (error) {
      console.error('[Stripe Webhook] Signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }
    
    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);
    
    // Process the webhook event
    const result = await processWebhookEvent(event);
    
    console.log(`[Stripe Webhook] Processed: ${result.message}`);
    
    return NextResponse.json(
      { 
        success: result.success,
        message: result.message,
        action: result.action,
        projectId: result.projectId,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('[Stripe Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      status: 'ok',
      endpoint: '/api/stripe/webhook',
      description: 'Stripe webhook handler endpoint',
      methods: ['POST'],
    },
    { status: 200 }
  );
}
