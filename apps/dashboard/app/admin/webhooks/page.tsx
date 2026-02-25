/**
 * Webhooks Settings Page
 * ST-11: Webhooks e Integrações
 * 
 * Main page for configuring webhooks
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Webhook as WebhookIcon, BarChart3, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { WebhookForm } from '@/components/webhook-form'
import { WebhookList } from '@/components/webhook-list'
import { WebhookDeliveryLogs } from '@/components/webhook-delivery-logs'
import {
  Webhook,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  WebhookStats,
} from '@/types/webhook'
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  regenerateWebhookSecret,
  getWebhookDeliveries,
  getWebhookStats,
} from '@/lib/webhook-service'

// Demo project ID - in production, this would come from context/params
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000001'

export default function WebhooksSettingsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project') || DEMO_PROJECT_ID
  const { toast } = useToast()

  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [deliveryOffset, setDeliveryOffset] = useState(0)
  const [deliveryCount, setDeliveryCount] = useState(0)
  const [activeTab, setActiveTab] = useState('webhooks')

  const DELIVERY_LIMIT = 20

  // Load initial data
  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [webhooksData, statsData] = await Promise.all([
        getWebhooks(projectId),
        getWebhookStats(projectId, 30),
      ])
      setWebhooks(webhooksData)
      setStats(statsData)

      // Load initial deliveries
      const { deliveries: deliveriesData, count } = await getWebhookDeliveries(
        projectId,
        { limit: DELIVERY_LIMIT }
      )
      setDeliveries(deliveriesData)
      setDeliveryCount(count)
    } catch (error) {
      console.error('Error loading webhooks data:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos webhooks.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreDeliveries = async () => {
    const newOffset = deliveryOffset + DELIVERY_LIMIT
    try {
      const { deliveries: newDeliveries, count } = await getWebhookDeliveries(
        projectId,
        { limit: DELIVERY_LIMIT, offset: newOffset }
      )
      setDeliveries((prev) => [...prev, ...newDeliveries])
      setDeliveryOffset(newOffset)
      setDeliveryCount(count)
    } catch (error) {
      console.error('Error loading more deliveries:', error)
    }
  }

  const handleCreateWebhook = async (data: CreateWebhookInput) => {
    setIsSubmitting(true)
    try {
      const newWebhook = await createWebhook(data)
      setWebhooks((prev) => [newWebhook, ...prev])
      setIsFormOpen(false)
      toast({
        title: 'Sucesso',
        description: 'Webhook criado com sucesso!',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o webhook.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateWebhook = async (data: UpdateWebhookInput) => {
    if (!editingWebhook) return

    setIsSubmitting(true)
    try {
      const updatedWebhook = await updateWebhook(editingWebhook.id, data)
      setWebhooks((prev) =>
        prev.map((w) => (w.id === updatedWebhook.id ? updatedWebhook : w))
      )
      setEditingWebhook(null)
      toast({
        title: 'Sucesso',
        description: 'Webhook atualizado com sucesso!',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o webhook.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      await deleteWebhook(webhookId)
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId))
      toast({
        title: 'Sucesso',
        description: 'Webhook excluído com sucesso!',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o webhook.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleStatus = async (
    webhookId: string,
    status: 'active' | 'inactive'
  ) => {
    try {
      const updatedWebhook = await updateWebhook(webhookId, { status })
      setWebhooks((prev) =>
        prev.map((w) => (w.id === updatedWebhook.id ? updatedWebhook : w))
      )
      toast({
        title: 'Sucesso',
        description: `Webhook ${status === 'active' ? 'ativado' : 'desativado'}!`,
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do webhook.',
        variant: 'destructive',
      })
    }
  }

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const result = await testWebhook(webhookId)
      if (result.success) {
        toast({
          title: 'Teste enviado',
          description: `Webhook respondou com status ${result.statusCode} em ${result.duration_ms}ms`,
        })
      } else {
        toast({
          title: 'Falha no teste',
          description: result.error || 'O webhook não respondeu corretamente.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível testar o webhook.',
        variant: 'destructive',
      })
    }
  }

  const handleRegenerateSecret = async (webhookId: string) => {
    const newSecret = await regenerateWebhookSecret(webhookId)
    toast({
      title: 'Secret regenerada',
      description: 'A nova chave secreta foi gerada. Atualize sua configuração.',
    })
    return newSecret
  }

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingWebhook(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <WebhookIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Webhooks</h1>
                <p className="text-sm text-gray-500">
                  Configure notificações em tempo real
                </p>
              </div>
            </div>
            <Button onClick={() => setIsFormOpen(true)} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="webhooks">
              <WebhookIcon className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="logs">
              <BarChart3 className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="docs">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {stats.total_deliveries}
                    </div>
                    <p className="text-sm text-gray-500">Total Entregas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.successful_deliveries}
                    </div>
                    <p className="text-sm text-gray-500">Sucessos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.failed_deliveries}
                    </div>
                    <p className="text-sm text-gray-500">Falhas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {stats.success_rate}%
                    </div>
                    <p className="text-sm text-gray-500">Taxa de Sucesso</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Webhook List */}
            <WebhookList
              webhooks={webhooks}
              onEdit={handleEditWebhook}
              onDelete={handleDeleteWebhook}
              onToggleStatus={handleToggleStatus}
              onTest={handleTestWebhook}
              onRegenerateSecret={handleRegenerateSecret}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="logs">
            <WebhookDeliveryLogs
              deliveries={deliveries}
              totalCount={deliveryCount}
              onLoadMore={loadMoreDeliveries}
              hasMore={deliveries.length < deliveryCount}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle>Documentação de Webhooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Eventos Disponíveis</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>
                      <code>feedback.created</code> - Disparado quando um novo
                      feedback é recebido
                    </li>
                    <li>
                      <code>feedback.updated</code> - Disparado quando um
                      feedback é atualizado
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Verificação de Assinatura</h3>
                  <p className="text-gray-600 mb-2">
                    Cada webhook inclui um header{' '}
                    <code>X-Webhook-Signature</code> com a assinatura HMAC-SHA256
                    do payload. Você deve verificar esta assinatura para garantir
                    que a requisição veio do TinyFeedback.
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Retry Automático</h3>
                  <p className="text-gray-600">
                    Se o seu endpoint retornar um erro HTTP (4xx ou 5xx), ou não
                    responder dentro de 30 segundos, o webhook será automaticamente
                    reenviado com backoff exponencial (1min, 2min, 4min, etc.) até
                    o número máximo de tentativas configurado.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Headers Enviados</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`Content-Type: application/json
X-Webhook-ID: webhook-uuid
X-Event-Type: feedback.created
X-Webhook-Signature: hmac-sha256-signature
X-Webhook-Version: 1.0`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
            </DialogTitle>
          </DialogHeader>
          <WebhookForm
            webhook={editingWebhook || undefined}
            projectId={projectId}
            onSubmit={editingWebhook ? handleUpdateWebhook : handleCreateWebhook}
            onCancel={handleCloseForm}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
