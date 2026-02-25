/**
 * Webhook Test API Route
 * ST-11: Webhooks e Integrações
 * 
 * Endpoint for testing webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

// Template transformers
function transformToSlackPayload(payload: Record<string, unknown>) {
  return {
    text: '🧪 Teste de Webhook',
    attachments: [
      {
        color: '#36a64f',
        title: 'Webhook Configurado Corretamente',
        text: 'Este é um teste do TinyFeedback. Se você está vendo esta mensagem, seu webhook está funcionando!',
        fields: [
          {
            title: 'Evento',
            value: payload.event,
            short: true,
          },
          {
            title: 'Timestamp',
            value: new Date().toISOString(),
            short: true,
          },
        ],
        footer: 'TinyFeedback',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  }
}

function transformToDiscordPayload(payload: Record<string, unknown>) {
  return {
    embeds: [
      {
        title: '🧪 Teste de Webhook',
        description:
          'Este é um teste do TinyFeedback. Se você está vendo esta mensagem, seu webhook está funcionando!',
        color: 3066993,
        fields: [
          {
            name: 'Evento',
            value: String(payload.event),
            inline: true,
          },
          {
            name: 'Timestamp',
            value: new Date().toISOString(),
            inline: true,
          },
        ],
        footer: {
          text: 'TinyFeedback',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, secret, payload, template = 'default' } = body

    if (!url || !secret || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: url, secret, payload' },
        { status: 400 }
      )
    }

    // Transform payload based on template
    let finalPayload = payload
    if (template === 'slack') {
      finalPayload = transformToSlackPayload(payload)
    } else if (template === 'discord') {
      finalPayload = transformToDiscordPayload(payload)
    }

    // Generate HMAC signature
    const payloadString = JSON.stringify(finalPayload)
    const signature = createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex')

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Event-Type': String(payload.event || 'test'),
      'X-Webhook-Version': '1.0',
    }

    // Send the webhook
    const startTime = Date.now()
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payloadString,
    })
    const duration = Date.now() - startTime

    const responseBody = await response.text()

    // Return result
    return NextResponse.json({
      success: response.ok,
      statusCode: response.status,
      duration_ms: duration,
      response: responseBody.slice(0, 1000), // Limit response size
    })
  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
