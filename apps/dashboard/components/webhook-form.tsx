/**
 * Webhook Form Component
 * ST-11: Webhooks e Integrações
 * 
 * Form for creating and editing webhooks
 */

'use client'

import { useState } from 'react'
import { 
  Webhook, 
  CreateWebhookInput, 
  UpdateWebhookInput,
  WEBHOOK_EVENT_OPTIONS,
  WEBHOOK_TEMPLATE_OPTIONS,
} from '@/types/webhook'
import { validateWebhookUrl } from '@/lib/webhook-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Check, Globe, Bell, FileJson } from 'lucide-react'

interface WebhookFormProps {
  webhook?: Webhook
  projectId: string
  onSubmit: (data: CreateWebhookInput | UpdateWebhookInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function WebhookForm({ 
  webhook, 
  projectId, 
  onSubmit, 
  onCancel, 
  isLoading 
}: WebhookFormProps) {
  const isEditing = !!webhook

  const [formData, setFormData] = useState<{
    name: string
    url: string
    events: string[]
    template: string
    maxRetries: number
    description: string
  }>({
    name: webhook?.name || '',
    url: webhook?.url || '',
    events: webhook?.events || ['feedback.created'],
    template: webhook?.template || 'default',
    maxRetries: webhook?.max_retries || 3,
    description: webhook?.description || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPayloadExample, setShowPayloadExample] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL é obrigatória'
    } else {
      const urlValidation = validateWebhookUrl(formData.url)
      if (!urlValidation.valid) {
        newErrors.url = urlValidation.error || 'URL inválida'
      }
    }

    if (formData.events.length === 0) {
      newErrors.events = 'Selecione pelo menos um evento'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const submitData = isEditing
      ? {
          name: formData.name,
          url: formData.url,
          events: formData.events as ('feedback.created' | 'feedback.updated')[],
          template: formData.template as 'default' | 'slack' | 'discord',
          max_retries: formData.maxRetries,
          description: formData.description || undefined,
        }
      : {
          project_id: projectId,
          name: formData.name,
          url: formData.url,
          events: formData.events as ('feedback.created' | 'feedback.updated')[],
          template: formData.template as 'default' | 'slack' | 'discord',
          max_retries: formData.maxRetries,
          description: formData.description || undefined,
        }

    await onSubmit(submitData)
  }

  const toggleEvent = (eventValue: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter((e) => e !== eventValue)
        : [...prev.events, eventValue],
    }))
  }

  const selectedTemplate = WEBHOOK_TEMPLATE_OPTIONS.find(
    (t) => t.value === formData.template
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">
            Nome do Webhook
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex: Notificações Slack"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="url">
            URL do Webhook
            <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://hooks.slack.com/services/..."
              className={`pl-10 ${errors.url ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.url && (
            <p className="text-sm text-red-500 mt-1">{errors.url}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Use HTTPS para URLs de produção. URLs localhost são permitidas apenas para testes.
          </p>
        </div>

        <div>
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Descreva o propósito deste webhook..."
            rows={3}
          />
        </div>
      </div>

      {/* Events Selection */}
      <div className="space-y-3">
        <Label>
          Eventos
          <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-3">
          {WEBHOOK_EVENT_OPTIONS.map((event) => (
            <div key={event.value} className="flex items-start space-x-3">
              <Checkbox
                id={event.value}
                checked={formData.events.includes(event.value)}
                onCheckedChange={() => toggleEvent(event.value)}
              />
              <div className="space-y-1">
                <label
                  htmlFor={event.value}
                  className="text-sm font-medium cursor-pointer"
                >
                  {event.label}
                </label>
                <p className="text-sm text-gray-500">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
        {errors.events && (
          <p className="text-sm text-red-500">{errors.events}</p>
        )}
      </div>

      {/* Template Selection */}
      <div className="space-y-3">
        <Label htmlFor="template">Formato do Payload</Label>
        <Select
          value={formData.template}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, template: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEBHOOK_TEMPLATE_OPTIONS.map((template) => (
              <SelectItem key={template.value} value={template.value}>
                <div className="flex flex-col items-start">
                  <span>{template.label}</span>
                  <span className="text-xs text-gray-500">
                    {template.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payload Example */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                Exemplo de Payload
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPayloadExample(!showPayloadExample)}
              >
                {showPayloadExample ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
          </CardHeader>
          {showPayloadExample && (
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                <code>{selectedTemplate?.example}</code>
              </pre>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Retry Configuration */}
      <div className="space-y-3">
        <Label htmlFor="maxRetries">Tentativas de Retry</Label>
        <Select
          value={formData.maxRetries.toString()}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              maxRetries: parseInt(value),
            }))
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 5, 10].map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n} {n === 1 ? 'tentativa' : 'tentativas'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          Número máximo de tentativas em caso de falha. Backoff exponencial é aplicado entre tentativas.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Salvando...'
            : isEditing
            ? 'Salvar Alterações'
            : 'Criar Webhook'}
        </Button>
      </div>
    </form>
  )
}
