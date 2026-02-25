# ST-11: Webhooks e Integrações

## Overview

Sistema completo de webhooks para notificações em tempo real de eventos de feedback.

## Features

- ✅ **Webhooks configuráveis via UI**
- ✅ **Eventos: feedback.created, feedback.updated**
- ✅ **Retry automático com backoff exponencial**
- ✅ **Assinatura HMAC-SHA256 para segurança**
- ✅ **Templates Slack/Discord prontos**
- ✅ **Logs de entrega de webhooks**

## Arquivos Criados

### Database
- `supabase/migrations/00000000000001_webhooks.sql` - Schema completo das tabelas webhooks e webhook_deliveries

### Edge Functions
- `supabase/functions/process-webhooks/index.ts` - Processamento de webhooks com retry

### Frontend Types
- `apps/dashboard/types/webhook.ts` - Tipos TypeScript para webhooks

### Frontend Services
- `apps/dashboard/lib/webhook-service.ts` - Serviço para gerenciar webhooks

### Frontend Components
- `apps/dashboard/components/webhook-form.tsx` - Formulário de criação/edição
- `apps/dashboard/components/webhook-list.tsx` - Lista de webhooks
- `apps/dashboard/components/webhook-delivery-logs.tsx` - Logs de entrega

### Frontend Pages
- `apps/dashboard/app/admin/webhooks/page.tsx` - Página principal de configuração

### API Routes
- `apps/dashboard/app/api/webhooks/test/route.ts` - Endpoint para testar webhooks
- `apps/dashboard/app/api/webhooks/trigger/route.ts` - Endpoint para trigger manual

### UI Components
- `apps/dashboard/components/ui/button.tsx`
- `apps/dashboard/components/ui/input.tsx`
- `apps/dashboard/components/ui/label.tsx`
- `apps/dashboard/components/ui/textarea.tsx`
- `apps/dashboard/components/ui/select.tsx`
- `apps/dashboard/components/ui/checkbox.tsx`
- `apps/dashboard/components/ui/dialog.tsx`
- `apps/dashboard/components/ui/alert-dialog.tsx`
- `apps/dashboard/components/ui/card.tsx`
- `apps/dashboard/components/ui/switch.tsx`
- `apps/dashboard/components/ui/tabs.tsx`
- `apps/dashboard/components/ui/badge.tsx`
- `apps/dashboard/components/ui/use-toast.ts`

## Como Usar

### 1. Aplicar Migration

```bash
supabase db push
```

### 2. Deploy Edge Function

```bash
supabase functions deploy process-webhooks
```

### 3. Configurar Cron Job (Opcional)

Para processar webhooks automaticamente a cada minuto:

```bash
supabase functions schedule process-webhooks --cron '*/1 * * * *'
```

Ou use um serviço externo de cron para chamar:
```
POST /api/webhooks/trigger
Authorization: Bearer {CRON_SECRET}
```

### 4. Acessar UI

Navegue para `/admin/webhooks` no dashboard para configurar webhooks.

## Estrutura do Banco de Dados

### Tabela `webhooks`
- `id` - UUID primário
- `project_id` - Referência ao projeto
- `name` - Nome do webhook
- `url` - URL de destino
- `secret` - Chave HMAC para assinatura
- `status` - active/inactive/disabled
- `events` - Array de eventos subscritos
- `template` - default/slack/discord
- `max_retries` - Número máximo de tentativas
- `retry_count` - Contador de retries atuais

### Tabela `webhook_deliveries`
- `id` - UUID primário
- `webhook_id` - Referência ao webhook
- `event_type` - Tipo de evento
- `event_id` - ID do feedback que disparou
- `payload` - Payload enviado
- `signature` - Assinatura HMAC
- `status` - pending/delivered/failed/retrying
- `attempt_number` - Número da tentativa
- `next_retry_at` - Próxima tentativa (para retry)

## Verificação de Assinatura

Exemplo em Node.js:

```javascript
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
}

// Uso
const signature = req.headers['x-webhook-signature'];
const isValid = verifySignature(req.body, signature, WEBHOOK_SECRET);
```

## Templates de Payload

### Default (JSON)
```json
{
  "event": "feedback.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "webhook_id": "uuid",
  "data": {
    "id": "uuid",
    "type": "nps",
    "content": { "score": 9, "comment": "Great!" },
    "status": "new",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Slack
Formato otimizado para webhooks do Slack com attachments coloridos.

### Discord
Formato otimizado para webhooks do Discord com embeds.

## Retry Policy

- **Tentativa 1**: Imediata
- **Tentativa 2**: ~60 segundos
- **Tentativa 3**: ~120 segundos
- **Tentativa 4**: ~240 segundos
- **Máximo**: Configurável (padrão: 3 tentativas)

Backoff exponencial com jitter (±20%) para evitar thundering herd.

## Headers Enviados

```
Content-Type: application/json
X-Webhook-ID: webhook-uuid
X-Event-Type: feedback.created
X-Webhook-Signature: hmac-sha256-signature
X-Webhook-Version: 1.0
```

## Variáveis de Ambiente

Adicione ao `.env`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cron (opcional)
CRON_SECRET=sua-chave-secreta-para-cron
```
