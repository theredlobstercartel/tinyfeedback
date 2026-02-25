/**
 * Webhook List Component
 * ST-11: Webhooks e Integrações
 * 
 * Displays a list of webhooks with actions
 */

'use client'

import { useState } from 'react'
import { 
  Webhook, 
  WEBHOOK_STATUS_COLORS,
  WEBHOOK_DELIVERY_STATUS_COLORS,
} from '@/types/webhook'
import { 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Webhook as WebhookIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface WebhookListProps {
  webhooks: Webhook[]
  onEdit: (webhook: Webhook) => void
  onDelete: (webhookId: string) => Promise<void>
  onToggleStatus: (webhookId: string, status: 'active' | 'inactive') => Promise<void>
  onTest: (webhookId: string) => Promise<void>
  onRegenerateSecret: (webhookId: string) => Promise<string>
  isLoading?: boolean
}

export function WebhookList({
  webhooks,
  onEdit,
  onDelete,
  onToggleStatus,
  onTest,
  onRegenerateSecret,
  isLoading,
}: WebhookListProps) {
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null)
  const [regeneratingWebhookId, setRegeneratingWebhookId] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)

  const handleTest = async (webhookId: string) => {
    setTestingWebhookId(webhookId)
    try {
      await onTest(webhookId)
    } finally {
      setTestingWebhookId(null)
    }
  }

  const handleRegenerateSecret = async (webhookId: string) => {
    setRegeneratingWebhookId(webhookId)
    try {
      const newSecret = await onRegenerateSecret(webhookId)
      setShowSecret((prev) => ({ ...prev, [webhookId]: true }))
      // Auto-hide after 10 seconds for security
      setTimeout(() => {
        setShowSecret((prev) => ({ ...prev, [webhookId]: false }))
      }, 10000)
    } finally {
      setRegeneratingWebhookId(null)
    }
  }

  const copySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret)
    setCopiedSecret(secret)
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  if (webhooks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WebhookIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum webhook configurado
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Configure webhooks para receber notificações em tempo real quando feedbacks forem recebidos.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => {
        const statusColor = WEBHOOK_STATUS_COLORS[webhook.status]
        const deliveryStatusColor = webhook.last_delivery_status
          ? WEBHOOK_DELIVERY_STATUS_COLORS[webhook.last_delivery_status]
          : null

        return (
          <Card key={webhook.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    webhook.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    <WebhookIcon className={cn(
                      'w-5 h-5',
                      webhook.status === 'active' ? 'text-green-600' : 'text-gray-500'
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{webhook.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {webhook.url}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="secondary"
                        className={cn(statusColor.bg, statusColor.text)}
                      >
                        {statusColor.label}
                      </Badge>
                      {deliveryStatusColor && (
                        <Badge
                          variant="secondary"
                          className={cn(deliveryStatusColor.bg, deliveryStatusColor.text)}
                        >
                          {deliveryStatusColor.label}
                        </Badge>
                      )}
                      {webhook.template !== 'default' && (
                        <Badge variant="outline">
                          {webhook.template === 'slack' && 'Slack'}
                          {webhook.template === 'discord' && 'Discord'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.status === 'active'}
                    onCheckedChange={(checked) =>
                      onToggleStatus(webhook.id, checked ? 'active' : 'inactive')
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Events */}
              <div className="flex flex-wrap gap-2 mb-4">
                {webhook.events.map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event === 'feedback.created' && '📝 feedback.created'}
                    {event === 'feedback.updated' && '🔄 feedback.updated'}
                  </Badge>
                ))}
              </div>

              {/* Secret Key */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Chave Secreta (HMAC)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() =>
                        setShowSecret((prev) => ({
                          ...prev,
                          [webhook.id]: !prev[webhook.id],
                        }))
                      }
                    >
                      {showSecret[webhook.id] ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => copySecret(webhook.secret)}
                    >
                      {copiedSecret === webhook.secret ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <code className="text-xs font-mono break-all text-gray-700">
                  {showSecret[webhook.id]
                    ? webhook.secret
                    : '••••••••••••••••••••••••••••••••'}
                </code>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {webhook.last_triggered_at
                      ? `Último: ${new Date(webhook.last_triggered_at).toLocaleString('pt-BR')}`
                      : 'Nunca disparado'}
                  </span>
                </div>
                {webhook.retry_count > 0 && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{webhook.retry_count} retries</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(webhook)}
                  disabled={isLoading}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(webhook.id)}
                  disabled={testingWebhookId === webhook.id || isLoading}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {testingWebhookId === webhook.id ? 'Testando...' : 'Testar'}
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={regeneratingWebhookId === webhook.id || isLoading}
                    >
                      <RefreshCw className={cn(
                        'w-4 h-4 mr-1',
                        regeneratingWebhookId === webhook.id && 'animate-spin'
                      )} />
                      Regenerar Secret
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Regenerar Chave Secreta?</DialogTitle>
                      <DialogDescription>
                        Isso invalidará a chave atual. Você precisará atualizar
                        a configuração no seu sistema receptor.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogTrigger>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => handleRegenerateSecret(webhook.id)}
                          disabled={regeneratingWebhookId === webhook.id}
                        >
                          {regeneratingWebhookId === webhook.id
                            ? 'Regenerando...'
                            : 'Regenerar'}
                        </Button>
                      </DialogTrigger>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex-1" />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Webhook?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. O webhook será
                        permanentemente removido e as notificações não serão mais
                        enviadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(webhook.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
