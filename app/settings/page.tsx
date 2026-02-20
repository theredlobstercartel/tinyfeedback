'use client';

import { useState } from 'react';
import { Key, Copy, Check, ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DomainManager } from '@/components/settings';

// Demo project ID for testing
const DEMO_PROJECT_ID = '550e8400-e29b-41d4-a716-446655440001';

export default function SettingsPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  
  // Demo API key - in production, this would come from the project data
  const apiKey = 'tf_live_a7f9c2e4d8b1m5n3p6q9r2s5t8u1v4w7x0y3z6';

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back Link */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: '#888888' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#00ff88';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888888';
          }}
        >
          <ArrowLeft size={16} />
          Voltar para Dashboard
        </button>

        {/* Header */}
        <div className="space-y-2">
          <h1 
            className="text-3xl font-bold neon-text"
            style={{ color: '#00ff88' }}
          >
            Configurações
          </h1>
          <p style={{ color: '#888888' }}>
            Gerencie as configurações do seu projeto
          </p>
        </div>

        {/* API Key Section */}
        <div 
          className="p-6 space-y-6"
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #222222',
          }}
        >
          <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: '#222222' }}>
            <Key size={20} style={{ color: '#00ff88' }} />
            <div>
              <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
                API Key
              </h2>
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                Use esta chave para integrar o widget no seu site
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 px-4 py-3 text-sm font-mono focus:outline-none"
                style={{
                  backgroundColor: '#000000',
                  border: '1px solid #222222',
                  color: '#00ff88',
                }}
              />
              <button
                onClick={handleCopyApiKey}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: copied ? '#00ff88' : 'transparent',
                  color: copied ? '#000000' : '#00ff88',
                  border: '1px solid #00ff88',
                }}
                onMouseEnter={(e) => {
                  if (!copied) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title="Copiar API Key"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar
                  </>
                )}
              </button>
            </div>

            <div 
              className="p-3 text-xs space-y-1"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
                color: '#888888',
              }}
            >
              <p style={{ color: '#00ff88' }}>Como usar:</p>
              <pre 
                className="mt-2 p-2 overflow-x-auto"
                style={{ 
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem'
                }}
              >
                {`<script>
  window.TinyFeedback = {{
    apiKey: '${apiKey}'
  }};
</script>
<script src="https://widget.tinyfeedback.com/v1.js"></script>`}
              </pre>
            </div>
          </div>
        </div>

        {/* Domain Manager */}
        <DomainManager 
          projectId={DEMO_PROJECT_ID}
          initialDomains={[]}
        />

        {/* Status Card */}
        <div 
          className="p-4 text-sm"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222',
            color: '#888888'
          }}
        >
          <h3 className="mb-3" style={{ color: '#ffffff' }}>Status da Implementação:</h3>
          <div className="space-y-3">
            <div>
              <p style={{ color: '#00ff88', marginBottom: '0.5rem' }}><strong>ST-17: Criar Projeto com API Key</strong></p>
              <ul className="space-y-1 list-disc list-inside">
                <li style={{ color: '#00ff88' }}>✅ AC-01: Formulário de criação - Implementado</li>
                <li style={{ color: '#00ff88' }}>✅ AC-02: Gerar API key - Implementado</li>
                <li style={{ color: '#00ff88' }}>✅ AC-03: Mostrar API key - Implementado</li>
              </ul>
            </div>
            <div style={{ borderTop: '1px solid #222222', paddingTop: '0.75rem' }}>
              <p style={{ color: '#00ff88', marginBottom: '0.5rem' }}><strong>ST-19: Configurar Domínios Permitidos</strong></p>
              <ul className="space-y-1 list-disc list-inside">
                <li style={{ color: '#00ff88' }}>✅ AC-01: Adicionar domínio - Implementado</li>
                <li style={{ color: '#00ff88' }}>✅ AC-02: Remover domínio - Implementado</li>
                <li style={{ color: '#00ff88' }}>✅ AC-03: Validação - Implementado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
