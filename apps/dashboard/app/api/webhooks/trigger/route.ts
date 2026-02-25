/**
 * Webhook Trigger API Route
 * ST-11: Webhooks e Integrações
 * 
 * Manually trigger webhook processing (for testing or cron jobs)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Check authorization (optional - for cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get pending webhooks count
    const { data: pendingCount, error: countError } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'retrying'])

    if (countError) {
      console.error('Error counting pending webhooks:', countError)
      return NextResponse.json(
        { error: 'Failed to count pending webhooks' },
        { status: 500 }
      )
    }

    // Call the edge function to process webhooks
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'process-webhooks',
      {}
    )

    if (functionError) {
      console.error('Error invoking process-webhooks function:', functionError)
      return NextResponse.json(
        { error: 'Failed to process webhooks', details: functionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pending_before: pendingCount,
      ...functionData,
    })
  } catch (error) {
    console.error('Error in webhook trigger:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for simple status check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook trigger endpoint is available. Use POST to trigger processing.',
  })
}
