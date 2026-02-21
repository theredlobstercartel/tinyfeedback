import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { Subscription, SubscriptionResponse } from '@/types/subscription';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest): Promise<NextResponse<SubscriptionResponse>> {
  try {
    // Get the user session from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { subscription: null, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { subscription: null, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Get user's profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, plan')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { subscription: null, error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // If user doesn't have a Stripe subscription, return free plan
    if (!profile?.stripe_subscription_id || !stripe) {
      return NextResponse.json({
        subscription: {
          id: 'free',
          status: 'active',
          planName: 'Free',
          planId: 'free',
          amount: 0,
          currency: 'brl',
          interval: 'month',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          canceledAt: null,
          customerId: profile?.stripe_customer_id || '',
          subscriptionId: 'free',
        },
      });
    }

    // Fetch subscription from Stripe
    const stripeSubscription = await stripe!.subscriptions.retrieve(
      profile.stripe_subscription_id,
      {
        expand: ['items.data.price.product'],
      }
    ) as unknown as {
      id: string;
      status: string;
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
      canceled_at: number | null;
      customer: string;
      items: {
        data: Array<{
          price: {
            id: string;
            unit_amount: number | null;
            currency: string;
            recurring?: { interval: string };
            product: { name: string } | unknown;
          };
        }>;
      };
    };

    // Get the price and product details
    const item = stripeSubscription.items.data[0];
    const price = item.price;
    const product = price.product as { name: string };

    const subscription: Subscription = {
      id: stripeSubscription.id,
      status: stripeSubscription.status as Subscription['status'],
      planName: product?.name || 'Unknown',
      planId: price?.id || '',
      amount: (price.unit_amount || 0) / 100,
      currency: price.currency,
      interval: (price.recurring?.interval === 'year' ? 'year' : 'month') as Subscription['interval'],
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at 
        ? new Date(stripeSubscription.canceled_at * 1000).toISOString() 
        : null,
      customerId: stripeSubscription.customer as string,
      subscriptionId: stripeSubscription.id,
    };

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error in GET /api/subscription:', error);
    return NextResponse.json(
      { subscription: null, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
