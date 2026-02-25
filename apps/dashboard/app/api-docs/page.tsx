import { openApiSpec } from '@/lib/openapi-spec'

export const dynamic = 'force-static'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            TinyFeedback API
          </h1>
          <p className="text-lg text-slate-400">
            REST API para integração programática com o TinyFeedback
          </p>
          <div className="mt-4 flex gap-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              v1.0.0
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
              Stable
            </span>
          </div>
        </header>

        {/* Base URL */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Base URL</h2>
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
            <code className="text-green-400">/api/v1</code>
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Autenticação</h2>
          <p className="text-slate-400 mb-4">
            A API utiliza API keys para autenticação. Inclua sua chave no header{' '}
            <code className="bg-slate-800 px-2 py-0.5 rounded text-pink-400">X-API-Key</code>.
          </p>
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
            <div className="text-slate-500"># Exemplo de requisição</div>
            <div className="text-yellow-400">
              curl -X GET /api/v1/feedbacks \
            </div>
            <div className="text-yellow-400">
              &nbsp;&nbsp;-H &quot;X-API-Key: tf_xxxxxxxxxxxxxxxx&quot;
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Rate Limiting</h2>
          <p className="text-slate-400 mb-4">
            A API possui limites de requisições para garantir a estabilidade:
          </p>
          <ul className="list-disc list-inside text-slate-400 space-y-2 mb-4">
            <li>Plano Gratuito: <strong className="text-white">100 requisições/minuto</strong></li>
            <li>Plano Pro: <strong className="text-white">500 requisições/minuto</strong></li>
          </ul>
          <p className="text-slate-400">
            Os headers de rate limit são incluídos em todas as respostas:
          </p>
          <div className="mt-4 bg-slate-900 rounded-lg p-4 font-mono text-sm">
            <div className="text-cyan-400">X-RateLimit-Limit: 100</div>
            <div className="text-cyan-400">X-RateLimit-Remaining: 95</div>
            <div className="text-cyan-400">X-RateLimit-Reset: 1706745600</div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Endpoints</h2>

          {/* GET /feedbacks */}
          <EndpointCard
            method="GET"
            path="/feedbacks"
            description="Lista feedbacks do projeto com paginação e filtros"
            params={[
              { name: 'type', type: 'string', desc: 'Filter by type: nps, suggestion, bug' },
              { name: 'status', type: 'string', desc: 'Filter by status: new, analyzing, implemented, archived' },
              { name: 'from', type: 'date', desc: 'Filter by start date (ISO 8601)' },
              { name: 'to', type: 'date', desc: 'Filter by end date (ISO 8601)' },
              { name: 'page', type: 'number', desc: 'Page number (default: 1)' },
              { name: 'limit', type: 'number', desc: 'Items per page, max 100 (default: 20)' },
              { name: 'cursor', type: 'string', desc: 'Cursor for pagination' },
            ]}
            response={`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "nps",
      "content": { "score": 9, "comment": "Great!" },
      "status": "new",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true,
    "nextCursor": "..."
  }
}`}
          />

          {/* POST /feedbacks */}
          <EndpointCard
            method="POST"
            path="/feedbacks"
            description="Cria um novo feedback (NPS, sugestão ou bug)"
            body={[
              { name: 'type', required: true, desc: 'Tipo: nps, suggestion, bug' },
              { name: 'content', required: true, desc: 'Conteúdo específico do tipo' },
              { name: 'userId', required: false, desc: 'ID do usuário' },
              { name: 'userEmail', required: false, desc: 'Email do usuário' },
              { name: 'userName', required: false, desc: 'Nome do usuário' },
              { name: 'anonymousId', required: false, desc: 'ID anônimo' },
            ]}
            examples={[
              {
                name: 'NPS',
                code: `{
  "type": "nps",
  "content": {
    "score": 9,
    "comment": "Ótimo produto!"
  }
}`,
              },
              {
                name: 'Sugestão',
                code: `{
  "type": "suggestion",
  "content": {
    "title": "Adicionar dark mode",
    "description": "Seria ótimo ter opção de tema escuro.",
    "category": "Feature"
  }
}`,
              },
              {
                name: 'Bug',
                code: `{
  "type": "bug",
  "content": {
    "description": "Botão de login não funciona no mobile",
    "includeTechnicalInfo": true,
    "contactEmail": "user@example.com"
  }
}`,
              },
            ]}
            response={`{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "nps",
    "status": "new",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}`}
          />

          {/* GET /feedbacks/:id */}
          <EndpointCard
            method="GET"
            path="/feedbacks/:id"
            description="Retorna detalhes de um feedback específico"
            response={`{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "type": "nps",
    "content": { "score": 9, "comment": "Great!" },
    "user_email": "user@example.com",
    "status": "new",
    "priority": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}`}
          />

          {/* PATCH /feedbacks/:id */}
          <EndpointCard
            method="PATCH"
            path="/feedbacks/:id"
            description="Atualiza status ou prioridade de um feedback"
            body={[
              { name: 'status', required: false, desc: 'new, analyzing, implemented, archived' },
              { name: 'priority', required: false, desc: 'low, medium, high' },
            ]}
            response={`{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "implemented",
    "priority": "high",
    "updated_at": "2024-01-15T12:00:00Z"
  }
}`}
          />

          {/* DELETE /feedbacks/:id */}
          <EndpointCard
            method="DELETE"
            path="/feedbacks/:id"
            description="Remove um feedback permanentemente"
            response={`{
  "success": true,
  "data": {
    "id": "uuid",
    "deleted": true
  }
}`}
          />
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Códigos de Erro</h2>
          <div className="grid gap-4">
            <ErrorCode code="UNAUTHORIZED" status={401} desc="API key não fornecida" />
            <ErrorCode code="FORBIDDEN" status={403} desc="API key inválida ou domínio não autorizado" />
            <ErrorCode code="RATE_LIMITED" status={429} desc="Limite de requisições excedido" />
            <ErrorCode code="QUOTA_EXCEEDED" status={429} desc="Quota mensal excedida" />
            <ErrorCode code="VALIDATION_ERROR" status={400} desc="Dados inválidos na requisição" />
            <ErrorCode code="NOT_FOUND" status={404} desc="Recurso não encontrado" />
            <ErrorCode code="INTERNAL_ERROR" status={500} desc="Erro interno do servidor" />
          </div>
        </section>

        {/* Interactive Docs */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Documentação Interativa</h2>
          <p className="text-slate-400 mb-4">
            Explore e teste a API em tempo real com a documentação interativa Swagger UI:
          </p>
          <div className="flex gap-4">
            <a
              href="/api-docs/interactive"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Abrir Swagger UI
            </a>
          </div>
        </section>

        {/* OpenAPI Spec */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">OpenAPI Spec</h2>
          <p className="text-slate-400 mb-4">
            A especificação completa da API está disponível em formato OpenAPI 3.0:
          </p>
          <a
            href="/api/openapi.json"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download openapi.json
          </a>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-800 text-slate-500 text-sm">
          <p>TinyFeedback API Documentation &copy; 2024</p>
        </footer>
      </div>
    </div>
  )
}

// Components

function EndpointCard({
  method,
  path,
  description,
  params,
  body,
  examples,
  response,
}: {
  method: string
  path: string
  description: string
  params?: { name: string; type: string; desc: string }[]
  body?: { name: string; required: boolean; desc: string }[]
  examples?: { name: string; code: string }[]
  response: string
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PATCH: 'bg-yellow-500/20 text-yellow-400',
    DELETE: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="mb-8 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 p-4 bg-slate-900/50">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-lg font-mono text-white">{path}</code>
      </div>
      <div className="p-4">
        <p className="text-slate-400 mb-4">{description}</p>

        {params && params.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Query Parameters</h4>
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-slate-400">
                {params.map((param) => (
                  <tr key={param.name} className="border-t border-slate-800">
                    <td className="py-2 font-mono text-pink-400">{param.name}</td>
                    <td className="py-2 font-mono text-cyan-400">{param.type}</td>
                    <td className="py-2">{param.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {body && body.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Request Body</h4>
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Required</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-slate-400">
                {body.map((field) => (
                  <tr key={field.name} className="border-t border-slate-800">
                    <td className="py-2 font-mono text-pink-400">{field.name}</td>
                    <td className="py-2">{field.required ? 'Yes' : 'No'}</td>
                    <td className="py-2">{field.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {examples && examples.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Examples</h4>
            <div className="space-y-2">
              {examples.map((example) => (
                <details key={example.name} className="bg-slate-900 rounded-lg">
                  <summary className="px-4 py-2 cursor-pointer text-sm text-slate-300 hover:text-white">
                    {example.name}
                  </summary>
                  <pre className="px-4 py-3 text-sm overflow-x-auto">
                    <code className="text-green-400">{example.code}</code>
                  </pre>
                </details>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-white mb-2">Response (200 OK)</h4>
          <pre className="bg-slate-900 rounded-lg p-4 text-sm overflow-x-auto">
            <code className="text-green-400">{response}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

function ErrorCode({ code, status, desc }: { code: string; status: number; desc: string }) {
  const statusColors: Record<number, string> = {
    400: 'text-yellow-400',
    401: 'text-orange-400',
    403: 'text-red-400',
    404: 'text-red-400',
    429: 'text-purple-400',
    500: 'text-red-500',
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
      <code className="px-2 py-1 bg-slate-800 rounded text-pink-400 font-mono text-sm">
        {code}
      </code>
      <span className={`font-bold ${statusColors[status]}`}>{status}</span>
      <span className="text-slate-400">{desc}</span>
    </div>
  )
}