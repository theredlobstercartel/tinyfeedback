import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { CancelSubscriptionResponse } from '@/types/subscription';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest): Promise<NextResponse<CancelSubscriptionResponse>> {
  try {
    // Get the user session from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '', cancelAtPeriodEnd: false, currentPeriodEnd: '', error: 'Não autorizado' },
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
        { success: false, message: '', cancelAtPeriodEnd: false, currentPeriodEnd: '', error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Get user's profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id, plan')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_subscription_id || !stripe) {
      return NextResponse.json(
        { success: false, message: '', cancelAtPeriodEnd: false, currentPeriodEnd: '', error: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }

    // Cancel the subscription at period end (user keeps access until end of period)
    const stripeSubscription = await stripe!.subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    ) as unknown as { cancel_at_period_end: boolean; current_period_end: number };

    // Update profile in database
    await supabase
      .from('profiles')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso. Você mantém o acesso até o final do período pago.',
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/subscription/cancel:', error);
    return NextResponse.json(
      { success: false, message: '', cancelAtPeriodEnd: false, currentPeriodEnd: '', error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
