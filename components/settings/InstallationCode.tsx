'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Code, FileCode, Terminal } from 'lucide-react';

interface InstallationCodeProps {
  apiKey: string;
}

type Framework = 'html' | 'react' | 'nextjs';

export function InstallationCode({ apiKey }: InstallationCodeProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Framework>('html');

  const widgetUrl = 'https://tinyfeedback.com/widget.js';

  const codeExamples: Record<Framework, string> = {
    html: `<!-- Adicione isso antes do fechamento da tag </body> -->
<script src="${widgetUrl}" data-api-key="${apiKey}"></script>`,

    react: `// App.tsx ou layout.tsx
import { useEffect } from 'react';

function TinyFeedbackWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${widgetUrl}';
    script.setAttribute('data-api-key', '${apiKey}');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}

export default TinyFeedbackWidget;`,

    nextjs: `// app/layout.tsx ou pages/_app.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Script
          src="${widgetUrl}"
          data-api-key="${apiKey}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeExamples[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }, [activeTab, codeExamples]);

  const tabs: { id: Framework; label: string; icon: React.ReactNode }[] = [
    { id: 'html', label: 'HTML', icon: <FileCode size={16} /> },
    { id: 'react', label: 'React', icon: <Code size={16} /> },
    { id: 'nextjs', label: 'Next.js', icon: <Terminal size={16} /> },
  ];

  return (
    <div
      className="p-6 space-y-6"
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #222222',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: '#222222' }}>
        <Code size={20} style={{ color: '#00ff88' }} />
        <div>
          <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
            Código de Instalação
          </h2>
          <p style={{ color: '#888888', fontSize: '0.875rem' }}>
            Copie e cole no seu site para ativar o widget
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? '#00ff88' : '#000000',
              color: activeTab === tab.id ? '#000000' : '#888888',
              border: `1px solid ${activeTab === tab.id ? '#00ff88' : '#222222'}`,
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.borderColor = '#00ff88';
                e.currentTarget.style.color = '#00ff88';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.borderColor = '#222222';
                e.currentTarget.style.color = '#888888';
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Block */}
      <div className="relative">
        <pre
          className="p-4 overflow-x-auto text-sm font-mono"
          style={{
            backgroundColor: '#000000',
            border: '1px solid #222222',
            color: '#00ff88',
            lineHeight: 1.6,
          }}
        >
          <code>{codeExamples[activeTab]}</code>
        </pre>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all"
          style={{
            backgroundColor: copied ? '#00ff8820' : '#1a1a1a',
            border: `1px solid ${copied ? '#00ff88' : '#333333'}`,
            color: copied ? '#00ff88' : '#888888',
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = '#00ff88';
              e.currentTarget.style.color = '#00ff88';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = '#333333';
              e.currentTarget.style.color = '#888888';
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

      {/* Instructions */}
      <div
        className="p-4 space-y-3 text-sm"
        style={{
          backgroundColor: '#000000',
          border: '1px solid #222222',
          color: '#888888',
        }}
      >
        <p style={{ color: '#00ff88', fontWeight: 500 }}>Como instalar:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Copie o código acima para sua área de transferência</li>
          <li>Cole no arquivo HTML principal do seu site</li>
          <li>Para HTML puro, adicione antes do fechamento da tag <code style={{ color: '#00d4ff' }}>&lt;/body&gt;</code></li>
          <li>Para React/Next.js, adicione no componente principal</li>
          <li>O widget aparecerá automaticamente no canto inferior direito</li>
        </ol>
      </div>

      {/* API Key Info */}
      <div
        className="flex items-center justify-between p-3 text-xs"
        style={{
          backgroundColor: '#000000',
          border: '1px solid #222222',
          color: '#666666',
        }}
      >
        <span>API Key:</span>
        <code style={{ color: '#00ff88' }}>{apiKey}</code>
      </div>
    </div>
  );
}
