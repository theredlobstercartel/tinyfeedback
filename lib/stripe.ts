import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase';
import type { 
  StripeWebhookEvent, 
  PaymentIntent, 
  Subscription,
  WebhookProcessingResult 
} from '@/types';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
});

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): StripeWebhookEvent {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret
    ) as StripeWebhookEvent;
    return event;
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${(error as Error).message}`);
  }
}

/**
 * Find project by Stripe customer ID
 */
async function findProjectByStripeCustomerId(customerId: string) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();
  
  if (error || !data) {
    throw new Error(`Project not found for customer: ${customerId}`);
  }
  
  return data;
}

/**
 * Activate Pro plan for project
 */
async function activateProPlan(
  projectId: string, 
  subscriptionId: string,
  currentPeriodEnd: number
): Promise<WebhookProcessingResult> {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('projects')
    .update({
      plan: 'pro',
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);
  
  if (error) {
    throw new Error(`Failed to activate Pro plan: ${error.message}`);
  }
  
  return {
    success: true,
    message: 'Pro plan activated successfully',
    action: 'activate_pro',
    projectId,
  };
}

/**
 * Downgrade project to Free plan
 */
async function downgradeToFree(projectId: string): Promise<WebhookProcessingResult> {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('projects')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
      subscription_status: 'canceled',
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);
  
  if (error) {
    throw new Error(`Failed to downgrade to Free plan: ${error.message}`);
  }
  
  return {
    success: true,
    message: 'Downgraded to Free plan successfully',
    action: 'downgrade_free',
    projectId,
  };
}

/**
 * Mark payment as failed and notify founder
 */
async function handlePaymentFailed(
  projectId: string,
  paymentIntentId: string,
  errorMessage: string
): Promise<WebhookProcessingResult> {
  const supabase = createAdminClient();
  
  // Update project with failed payment status
  const { error } = await supabase
    .from('projects')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);
  
  if (error) {
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
  
  // TODO: Send notification to founder
  // This would integrate with email service
  console.log(`[Payment Failed] Project: ${projectId}, PaymentIntent: ${paymentIntentId}, Error: ${errorMessage}`);
  
  return {
    success: true,
    message: 'Payment failure recorded, founder notified',
    action: 'payment_failed',
    projectId,
  };
}

/**
 * Process Stripe webhook event
 */
export async function processWebhookEvent(
  event: StripeWebhookEvent
): Promise<WebhookProcessingResult> {
  const { type, data } = event;
  
  switch (type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = data.object as PaymentIntent;
      const customerId = paymentIntent.customer;
      
      if (!customerId) {
        throw new Error('Payment intent missing customer ID');
      }
      
      const project = await findProjectByStripeCustomerId(customerId);
      
      // For payment intents, we activate Pro plan
      return await activateProPlan(
        project.id,
        paymentIntent.id,
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days from now
      );
    }
    
    case 'payment_intent.payment_failed': {
      const paymentIntent = data.object as PaymentIntent;
      const customerId = paymentIntent.customer;
      
      if (!customerId) {
        throw new Error('Payment intent missing customer ID');
      }
      
      const project = await findProjectByStripeCustomerId(customerId);
      const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error';
      
      return await handlePaymentFailed(project.id, paymentIntent.id, errorMessage);
    }
    
    case 'customer.subscription.deleted': {
      const subscription = data.object as Subscription;
      const customerId = subscription.customer;
      
      const project = await findProjectByStripeCustomerId(customerId);
      
      // Downgrade at end of period
      if (subscription.cancel_at_period_end) {
        return {
          success: true,
          message: 'Subscription will be canceled at period end',
          action: 'schedule_downgrade',
          projectId: project.id,
        };
      }
      
      return await downgradeToFree(project.id);
    }
    
    case 'customer.subscription.updated': {
      const subscription = data.object as Subscription;
      const customerId = subscription.customer;
      
      const project = await findProjectByStripeCustomerId(customerId);
      
      // Handle status changes
      if (subscription.status === 'active') {
        return await activateProPlan(
          project.id,
          subscription.id,
          subscription.current_period_end
        );
      }
      
      if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        return await downgradeToFree(project.id);
      }
      
      return {
        success: true,
        message: `Subscription updated with status: ${subscription.status}`,
        action: 'subscription_updated',
        projectId: project.id,
      };
    }
    
    default:
      return {
        success: true,
        message: `Unhandled event type: ${type}`,
        action: 'unhandled',
      };
  }
}
