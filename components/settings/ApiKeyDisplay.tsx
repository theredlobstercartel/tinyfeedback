'use client';

import { useState } from 'react';
import { Copy, Check, Key, Eye, EyeOff } from 'lucide-react';

interface ApiKeyDisplayProps {
  apiKey: string;
  projectName: string;
}

export function ApiKeyDisplay({ apiKey, projectName }: ApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = apiKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maskedKey = showKey ? apiKey : `${apiKey.slice(0, 12)}${'•'.repeat(20)}`;

  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #222222',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: '#222222' }}>
        <Key size={20} style={{ color: '#00ff88' }} />
        <div>
          <h3
            style={{
              color: '#ffffff',
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: 0,
            }}
          >
            API Key
          </h3>
          <p style={{ color: '#888888', fontSize: '0.875rem', margin: 0 }}>
            Use esta chave para integrar o widget no seu site
          </p>
        </div>
      </div>

      {/* API Key Display */}
      <div className="space-y-2">
        <label
          htmlFor="api-key"
          style={{ color: '#888888', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}
        >
          Chave de API para {projectName}
        </label>

        <div className="flex gap-2">
          <input
            id="api-key"
            type="text"
            value={maskedKey}
            readOnly
            className="flex-1 px-4 py-3 text-sm font-mono focus:outline-none"
            style={{
              backgroundColor: '#000000',
              border: '1px solid #333333',
              color: '#ffffff',
            }}
          />

          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 transition-colors"
            style={{
              backgroundColor: '#000000',
              border: '1px solid #333333',
              color: '#888888',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00ff88';
              e.currentTarget.style.color = '#00ff88';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333333';
              e.currentTarget.style.color = '#888888';
            }}
            title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
          >
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 font-medium transition-colors"
            style={{
              backgroundColor: copied ? '#00ff88' : '#1a1a1a',
              border: copied ? '1px solid #00ff88' : '1px solid #333333',
              color: copied ? '#000000' : '#ffffff',
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.borderColor = '#00ff88';
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.borderColor = '#333333';
              }
            }}
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
      </div>

      {/* Installation Code */}
      <div className="space-y-2">
        <label style={{ color: '#888888', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
          Código de instalação
        </label>

        <pre
          style={{
            backgroundColor: '#000000',
            border: '1px solid #333333',
            padding: '16px',
            overflow: 'auto',
            fontSize: '0.8125rem',
            lineHeight: '1.5',
            margin: 0,
          }}
        >
          <code
            style={{
              fontFamily: 'monospace',
              color: '#00ff88',
            }}
          >
            {`// Adicione este código antes do fechamento da tag body
<script src="https://widget.tinyfeedback.io/v1.js"></script>
<script>
  TinyFeedback.init({
    apiKey: '${apiKey}'
  });
</script>`}
          </code>
        </pre>

        <p
          style={{
            color: '#666666',
            fontSize: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          Cole este código no final do seu HTML.
        </p>
      </div>
    </div>
  );
}
