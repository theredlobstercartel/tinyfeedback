import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Webhook secret from environment variables
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const projectId = session.metadata?.projectId;
        const subscriptionId = session.subscription as string;

        if (!projectId || !subscriptionId) {
          console.error('Missing projectId or subscriptionId in session metadata');
          break;
        }

        // Fetch subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Update project with subscription info
        const { error } = await supabase
          .from('projects')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            subscription_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            plan: 'pro',
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        if (error) {
          console.error('Error updating project after checkout:', error);
        } else {
          console.log(`Project ${projectId} upgraded to Pro`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        
        if (!subscriptionId) break;

        // Fetch subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Update subscription period
        const { error } = await supabase
          .from('projects')
          .update({
            subscription_status: subscription.status,
            subscription_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Error updating subscription period:', error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        
        if (!subscriptionId) break;

        // Update subscription status to past_due
        const { error } = await supabase
          .from('projects')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Error updating subscription status to past_due:', error);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from('projects')
          .update({
            subscription_status: subscription.status,
            subscription_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from('projects')
          .update({
            subscription_status: 'canceled',
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error canceling subscription:', error);
        } else {
          console.log(`Subscription ${subscription.id} canceled, project downgraded to Free`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
