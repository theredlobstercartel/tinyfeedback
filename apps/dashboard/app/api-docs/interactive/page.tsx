'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function SwaggerDocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/openapi.json')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load OpenAPI spec:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Carregando documentação...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Custom Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">TinyFeedback API</h1>
              <p className="text-slate-400 mt-1">
                Documentação interativa da API REST
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/api-docs"
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                ← Voltar para API Docs
              </a>
              <a
                href="/api/openapi.json"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Download JSON
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Swagger UI */}
      <div className="swagger-wrapper">
        {spec && (
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelExpandDepth={3}
            displayRequestDuration={true}
            filter={true}
            tryItOutEnabled={true}
          />
        )}
      </div>

      {/* Custom Styles for Swagger UI Dark Theme */}
      <style jsx global>{`
        .swagger-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .swagger-wrapper .swagger-ui {
          background: #0f172a;
          color: #e2e8f0;
        }
        
        .swagger-wrapper .swagger-ui .info .title {
          color: #fff;
        }
        
        .swagger-wrapper .swagger-ui .info p {
          color: #94a3b8;
        }
        
        .swagger-wrapper .swagger-ui .scheme-container {
          background: #1e293b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        .swagger-wrapper .swagger-ui .opblock {
          background: #1e293b;
          border: 1px solid #334155;
        }
        
        .swagger-wrapper .swagger-ui .opblock .opblock-summary {
          border-bottom: 1px solid #334155;
        }
        
        .swagger-wrapper .swagger-ui .opblock.opblock-get {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
        }
        
        .swagger-wrapper .swagger-ui .opblock.opblock-post {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .swagger-wrapper .swagger-ui .opblock.opblock-patch {
          background: rgba(234, 179, 8, 0.1);
          border-color: rgba(234, 179, 8, 0.3);
        }
        
        .swagger-wrapper .swagger-ui .opblock.opblock-delete {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }
        
        .swagger-wrapper .swagger-ui .opblock .opblock-summary-method {
          font-weight: 600;
        }
        
        .swagger-wrapper .swagger-ui .opblock .opblock-summary-path {
          color: #fff;
        }
        
        .swagger-wrapper .swagger-ui .opblock .opblock-summary-description {
          color: #94a3b8;
        }
        
        .swagger-wrapper .swagger-ui .opblock-tag {
          color: #fff;
          border-bottom: 1px solid #334155;
        }
        
        .swagger-wrapper .swagger-ui .opblock-tag small {
          color: #64748b;
        }
        
        .swagger-wrapper .swagger-ui .parameter__name {
          color: #f472b6;
        }
        
        .swagger-wrapper .swagger-ui .parameter__type {
          color: #22d3ee;
        }
        
        .swagger-wrapper .swagger-ui table thead tr th {
          color: #94a3b8;
          border-bottom: 1px solid #334155;
        }
        
        .swagger-wrapper .swagger-ui .prop-format {
          color: #64748b;
        }
        
        .swagger-wrapper .swagger-ui .response-col_status {
          color: #22c55e;
        }
        
        .swagger-wrapper .swagger-ui .btn {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #fff;
        }
        
        .swagger-wrapper .swagger-ui .btn:hover {
          background: #2563eb;
        }
        
        .swagger-wrapper .swagger-ui select {
          background: #0f172a;
          border-color: #334155;
          color: #e2e8f0;
        }
        
        .swagger-wrapper .swagger-ui input[type="text"] {
          background: #0f172a;
          border-color: #334155;
          color: #e2e8f0;
        }
        
        .swagger-wrapper .swagger-ui .model-box {
          background: #1e293b;
        }
        
        .swagger-wrapper .swagger-ui section.models {
          border-color: #334155;
        }
        
        .swagger-wrapper .swagger-ui section.models h4 {
          color: #fff;
        }
        
        .swagger-wrapper .swagger-ui .model-title {
          color: #f472b6;
        }
        
        .swagger-wrapper .swagger-ui .renderedMarkdown p {
          color: #94a3b8;
        }
        
        .swagger-wrapper .swagger-ui .tab li {
          color: #64748b;
        }
        
        .swagger-wrapper .swagger-ui .tab li.active {
          color: #3b82f6;
        }
        
        .swagger-wrapper .swagger-ui .auth-container .wrapper {
          background: #1e293b;
        }
        
        .swagger-wrapper .swagger-ui .auth-btn-wrapper {
          background: #1e293b;
        }
        
        .swagger-wrapper .swagger-ui .dialog-ux .modal-ux {
          background: #1e293b;
        }
        
        .swagger-wrapper .swagger-ui .dialog-ux .modal-ux-header {
          border-bottom: 1px solid #334155;
        }
        
        .swagger-wrapper .swagger-ui .dialog-ux .modal-ux-header h3 {
          color: #fff;
        }
        
        .swagger-wrapper .swagger-ui .dialog-ux .modal-ux-content h4 {
          color: #94a3b8;
        }
        
        .swagger-wrapper .swagger-ui .dialog-ux .modal-ux-content p {
          color: #64748b;
        }
        
        .swagger-wrapper .swagger-ui .auth-container .errors {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </div>
  )
}
