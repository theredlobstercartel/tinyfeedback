/**
 * Webhook Types
 * ST-11: Webhooks e Integrações
 */

export type WebhookEventType = 'feedback.created' | 'feedback.updated'

export type WebhookStatus = 'active' | 'inactive' | 'disabled'

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying'

export type WebhookTemplateType = 'default' | 'slack' | 'discord'

export interface Webhook {
  id: string
  project_id: string
  name: string
  url: string
  secret: string
  status: WebhookStatus
  events: WebhookEventType[]
  template: WebhookTemplateType
  custom_headers?: Record<string, string>
  max_retries: number
  retry_count: number
  description?: string
  last_triggered_at?: string
  last_delivery_status?: WebhookDeliveryStatus
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  project_id: string
  event_type: WebhookEventType
  event_id: string
  payload: Record<string, unknown>
  headers: Record<string, string>
  signature: string
  status: WebhookDeliveryStatus
  http_status_code?: number
  response_body?: string
  response_headers?: Record<string, string>
  request_started_at?: string
  request_completed_at?: string
  duration_ms?: number
  attempt_number: number
  next_retry_at?: string
  error_message?: string
  created_at: string
}

export interface WebhookStats {
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  retrying_deliveries: number
  success_rate: number
  avg_duration_ms: number
}

export interface CreateWebhookInput {
  project_id: string
  name: string
  url: string
  events: WebhookEventType[]
  template?: WebhookTemplateType
  custom_headers?: Record<string, string>
  max_retries?: number
  description?: string
}

export interface UpdateWebhookInput {
  name?: string
  url?: string
  events?: WebhookEventType[]
  template?: WebhookTemplateType
  custom_headers?: Record<string, string>
  max_retries?: number
  description?: string
  status?: WebhookStatus
}

export interface WebhookTestResult {
  success: boolean
  statusCode?: number
  response?: string
  error?: string
  duration_ms?: number
}

// Event type options for UI
export const WEBHOOK_EVENT_OPTIONS: { value: WebhookEventType; label: string; description: string }[] = [
  {
    value: 'feedback.created',
    label: 'Feedback Criado',
    description: 'Disparado quando um novo feedback é recebido',
  },
  {
    value: 'feedback.updated',
    label: 'Feedback Atualizado',
    description: 'Disparado quando um feedback é atualizado (status, etc.)',
  },
]

// Template options for UI
export const WEBHOOK_TEMPLATE_OPTIONS: { value: WebhookTemplateType; label: string; description: string; example: string }[] = [
  {
    value: 'default',
    label: 'Padrão (JSON)',
    description: 'Payload JSON genérico compatível com qualquer sistema',
    example: JSON.stringify({
      event: 'feedback.created',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        id: 'uuid',
        type: 'nps',
        content: { score: 9, comment: 'Great!' },
      },
    }, null, 2),
  },
  {
    value: 'slack',
    label: 'Slack',
    description: 'Formato otimizado para webhooks do Slack',
    example: JSON.stringify({
      text: '📝 Novo Feedback Recebido',
      attachments: [{
        color: '#36a64f',
        title: 'NPS Score: 9/10',
        fields: [
          { title: 'Tipo', value: 'nps', short: true },
          { title: 'Status', value: 'new', short: true },
        ],
      }],
    }, null, 2),
  },
  {
    value: 'discord',
    label: 'Discord',
    description: 'Formato otimizado para webhooks do Discord',
    example: JSON.stringify({
      embeds: [{
        title: '📝 Novo Feedback Recebido',
        color: 3066993,
        fields: [
          { name: 'Tipo', value: 'nps', inline: true },
          { name: 'Status', value: 'new', inline: true },
        ],
      }],
    }, null, 2),
  },
]

// Status badge colors
export const WEBHOOK_STATUS_COLORS: Record<WebhookStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
  disabled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Desativado' },
}

export const WEBHOOK_DELIVERY_STATUS_COLORS: Record<WebhookDeliveryStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregue' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Falhou' },
  retrying: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Tentando novamente' },
}
