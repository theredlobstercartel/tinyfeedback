import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLAN_CONFIG } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { projectId, userEmail, userId } = body;

    // Validate required fields
    if (!projectId || !userEmail) {
      return NextResponse.json(
        { error: 'Project ID e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project to check if it already has a Stripe customer
    const { data: project, error: projectError } = await supabase
      .from('bmad_projects')
      .select('id, name, stripe_customer_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Project fetch error:', projectError);
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    let customerId = project.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          projectId: projectId,
          userId: userId || '',
        },
      });
      customerId = customer.id;

      // Save customer ID to project
      await supabase
        .from('bmad_projects')
        .update({ stripe_customer_id: customerId })
        .eq('id', projectId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      billing_address_collection: 'auto',
      line_items: [
        {
          price: PLAN_CONFIG.pro.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?canceled=true`,
      metadata: {
        projectId: projectId,
        userId: userId || '',
      },
      subscription_data: {
        metadata: {
          projectId: projectId,
          userId: userId || '',
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    );
  }
}
