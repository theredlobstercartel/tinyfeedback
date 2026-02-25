/**
 * Webhook Delivery Logs Component
 * ST-11: Webhooks e Integrações
 * 
 * Displays webhook delivery history with filtering
 */

'use client'

import { useState } from 'react'
import { WebhookDelivery, WEBHOOK_DELIVERY_STATUS_COLORS } from '@/types/webhook'
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface WebhookDeliveryLogsProps {
  deliveries: WebhookDelivery[]
  totalCount: number
  onLoadMore: () => void
  hasMore: boolean
  isLoading?: boolean
}

export function WebhookDeliveryLogs({
  deliveries,
  totalCount,
  onLoadMore,
  hasMore,
  isLoading,
}: WebhookDeliveryLogsProps) {
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredDeliveries = statusFilter === 'all'
    ? deliveries
    : deliveries.filter((d) => d.status === statusFilter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'retrying':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Logs de Entrega</CardTitle>
            <p className="text-sm text-gray-500">
              {totalCount} entregas no total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="retrying">Tentando</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma entrega encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => {
              const statusColor = WEBHOOK_DELIVERY_STATUS_COLORS[delivery.status]
              const isExpanded = expandedDeliveryId === delivery.id

              return (
                <div
                  key={delivery.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedDeliveryId(isExpanded ? null : delivery.id)
                    }
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {getStatusIcon(delivery.status)}
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(statusColor.bg, statusColor.text)}
                        >
                          {statusColor.label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {delivery.event_type === 'feedback.created'
                            ? '📝 feedback.created'
                            : '🔄 feedback.updated'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>
                          {new Date(delivery.created_at).toLocaleString('pt-BR')}
                        </span>
                        {delivery.http_status_code && (
                          <span
                            className={cn(
                              delivery.http_status_code >= 200 &&
                                delivery.http_status_code < 300
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}
                          >
                            HTTP {delivery.http_status_code}
                          </span>
                        )}
                        <span>{formatDuration(delivery.duration_ms)}</span>
                        {delivery.attempt_number > 1 && (
                          <span className="text-amber-600">
                            Tentativa #{delivery.attempt_number}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Entrega</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-6 mt-4">
                            {/* Request Info */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Request
                              </h4>
                              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-xs text-gray-100">
                                  <code>
                                    {JSON.stringify(
                                      delivery.payload,
                                      null,
                                      2
                                    )}
                                  </code>
                                </pre>
                              </div>
                            </div>

                            {/* Headers */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Headers
                              </h4>
                              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-xs text-gray-100">
                                  <code>
                                    {JSON.stringify(
                                      delivery.headers,
                                      null,
                                      2
                                    )}
                                  </code>
                                </pre>
                              </div>
                            </div>

                            {/* Signature */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Assinatura HMAC
                              </h4>
                              <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">
                                {delivery.signature}
                              </code>
                            </div>

                            {/* Response */}
                            {delivery.response_body && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">
                                  Response
                                </h4>
                                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                  <pre className="text-xs text-gray-100">
                                    <code>{delivery.response_body}</code>
                                  </pre>
                                </div>
                              </div>
                            )}

                            {/* Error */}
                            {delivery.error_message && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">
                                  Erro
                                </h4>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <p className="text-sm text-red-700">
                                    {delivery.error_message}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="pt-4 space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1">
                            Payload
                          </h4>
                          <pre className="text-xs bg-white border rounded p-3 overflow-x-auto">
                            <code>
                              {JSON.stringify(delivery.payload, null, 2)}
                            </code>
                          </pre>
                        </div>

                        {delivery.error_message && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-1">
                              Erro
                            </h4>
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                              {delivery.error_message}
                            </p>
                          </div>
                        )}

                        {delivery.next_retry_at && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <RefreshCw className="w-4 h-4" />
                            <span>
                              Próxima tentativa:{' '}
                              {new Date(delivery.next_retry_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {hasMore && (
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Carregando...' : 'Carregar mais'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
