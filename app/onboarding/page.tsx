'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, FolderPlus, Code, Check, Copy, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Bem-vindo',
    description: 'Comece a coletar feedbacks em minutos',
  },
  {
    id: 2,
    title: 'Criar Projeto',
    description: 'Dê um nome ao seu primeiro projeto',
  },
  {
    id: 3,
    title: 'Instalar Widget',
    description: 'Adicione o código ao seu site',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdProject, setCreatedProject] = useState<{ name: string; api_key: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Nome do projeto é obrigatório');
      return;
    }

    if (projectName.trim().length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar projeto');
      }

      setCreatedProject({
        name: result.data.name,
        api_key: result.data.api_key,
      });
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdProject) return;

    const widgetCode = `<!-- TinyFeedback Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://widget.tinyfeedback.com/v1/widget.js';
    script.async = true;
    script.dataset.apiKey = '${createdProject.api_key}';
    document.head.appendChild(script);
  })();
</script>`;

    await navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const widgetCode = createdProject
    ? `<!-- TinyFeedback Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://widget.tinyfeedback.com/v1/widget.js';
    script.async = true;
    script.dataset.apiKey = '${createdProject.api_key}';
    document.head.appendChild(script);
  })();
</script>`
    : '';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <header className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 
            className="text-xl font-bold neon-text"
            style={{ color: '#00ff88' }}
          >
            TinyFeedback
          </h1>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className="w-10 h-10 flex items-center justify-center font-bold text-sm transition-all duration-300"
                    style={{
                      backgroundColor: currentStep > step.id ? '#00ff88' : currentStep === step.id ? '#00ff88' : '#0a0a0a',
                      color: currentStep > step.id ? '#000000' : currentStep === step.id ? '#000000' : '#888888',
                      border: currentStep >= step.id ? '2px solid #00ff88' : '2px solid #222222',
                    }}
                  >
                    {currentStep > step.id ? (
                      <Check size={20} />
                    ) : (
                      step.id
                    )}
                  </div>
                  {/* Step Title */}
                  <span
                    className="mt-2 text-xs font-medium hidden sm:block"
                    style={{
                      color: currentStep >= step.id ? '#ffffff' : '#666666',
                    }}
                  >
                    {step.title}
                  </span>
                </div>
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-4 transition-all duration-300"
                    style={{
                      backgroundColor: currentStep > step.id ? '#00ff88' : '#222222',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div
              className="p-8 text-center space-y-6"
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #222222',
              }}
            >
              <div className="flex justify-center">
                <div
                  className="w-20 h-20 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    border: '2px solid #00ff88',
                  }}
                >
                  <Sparkles size={40} style={{ color: '#00ff88' }} />
                </div>
              </div>

              <div className="space-y-2">
                <h2 style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: 700 }}>
                  Bem-vindo ao TinyFeedback! 🚀
                </h2>
                <p style={{ color: '#888888', fontSize: '1.125rem' }}>
                  Vamos configurar seu primeiro projeto em apenas 3 passos simples.
                </p>
              </div>

              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3" style={{ color: '#ffffff' }}>
                  <div style={{ color: '#00ff88' }}>✓</div>
                  <span>Coleção de feedbacks ilimitada</span>
                </div>
                <div className="flex items-center gap-3" style={{ color: '#ffffff' }}>
                  <div style={{ color: '#00ff88' }}>✓</div>
                  <span>Widget personalizável</span>
                </div>
                <div className="flex items-center gap-3" style={{ color: '#ffffff' }}>
                  <div style={{ color: '#00ff88' }}>✓</div>
                  <span>API key única para cada projeto</span>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full max-w-md py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: '#00ff88',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ffaa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ff88';
                }}
              >
                Começar
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Step 2: Create Project */}
          {currentStep === 2 && (
            <div
              className="p-8 space-y-6"
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #222222',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid #00ff88',
                  }}
                >
                  <FolderPlus size={24} style={{ color: '#00ff88' }} />
                </div>
                <div>
                  <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700 }}>
                    Criar Primeiro Projeto
                  </h2>
                  <p style={{ color: '#888888' }}>
                    Dê um nome identificável ao seu projeto
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium"
                  style={{ color: '#888888' }}
                >
                  Nome do Projeto
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    setError('');
                  }}
                  placeholder="Meu SaaS Incrível"
                  disabled={isCreating}
                  className="w-full py-4 px-4 text-lg transition-colors"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: error ? '1px solid #ff4444' : '1px solid #222222',
                  }}
                  onFocus={(e) => {
                    if (!error) e.currentTarget.style.borderColor = '#00ff88';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = error ? '#ff4444' : '#222222';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateProject();
                    }
                  }}
                />
                {error && (
                  <p style={{ color: '#ff4444', fontSize: '0.875rem' }}>
                    {error}
                  </p>
                )}
                <p style={{ color: '#666666', fontSize: '0.75rem' }}>
                  Mínimo 3 caracteres • Máximo 100 caracteres
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={isCreating}
                  className="flex-1 py-3 font-medium flex items-center justify-center gap-2 transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#888888',
                    border: '1px solid #444444',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCreating) {
                      e.currentTarget.style.borderColor = '#888888';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#444444';
                    e.currentTarget.style.color = '#888888';
                  }}
                >
                  <ArrowLeft size={18} />
                  Voltar
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className="flex-[2] py-3 font-medium flex items-center justify-center gap-2 transition-colors"
                  style={{
                    backgroundColor: isCreating ? '#1a1a1a' : '#00ff88',
                    color: '#000000',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    opacity: isCreating ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isCreating) {
                      e.currentTarget.style.backgroundColor = '#00ffaa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCreating) {
                      e.currentTarget.style.backgroundColor = '#00ff88';
                    }
                  }}
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      Criar Projeto
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Installation Code */}
          {currentStep === 3 && createdProject && (
            <div
              className="p-8 space-y-6"
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #222222',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid #00ff88',
                  }}
                >
                  <Code size={24} style={{ color: '#00ff88' }} />
                </div>
                <div>
                  <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700 }}>
                    Instalar Widget
                  </h2>
                  <p style={{ color: '#888888' }}>
                    Copie e cole este código no seu site
                  </p>
                </div>
              </div>

              <div
                className="p-4"
                style={{
                  backgroundColor: 'rgba(0, 255, 136, 0.05)',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} style={{ color: '#00ff88' }} />
                  <span style={{ color: '#00ff88', fontSize: '0.875rem' }}>
                    Projeto "{createdProject.name}" criado com sucesso!
                  </span>
                </div>
                <p style={{ color: '#888888', fontSize: '0.75rem' }}>
                  API Key: {createdProject.api_key}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium"
                    style={{ color: '#888888' }}
                  >
                    Código do Widget
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 px-3 py-1 text-sm transition-colors"
                    style={{
                      backgroundColor: copied ? 'rgba(0, 255, 136, 0.1)' : '#1a1a1a',
                      color: copied ? '#00ff88' : '#ffffff',
                      border: copied ? '1px solid #00ff88' : '1px solid #333333',
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <pre
                  className="p-4 text-sm overflow-x-auto"
                  style={{
                    backgroundColor: '#000000',
                    color: '#00ff88',
                    border: '1px solid #222222',
                    fontFamily: 'Geist Mono, monospace',
                  }}
                >
                  <code>{widgetCode}</code>
                </pre>
              </div>

              <div className="space-y-3">
                <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                  <strong style={{ color: '#ffffff' }}>Próximos passos:</strong>
                </p>
                <ol className="space-y-2" style={{ color: '#888888', fontSize: '0.875rem' }}>
                  <li className="flex gap-2">
                    <span style={{ color: '#00ff88' }}>1.</span>
                    Cole o código antes da tag &lt;/head&gt; do seu site
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: '#00ff88' }}>2.</span>
                    O widget aparecerá automaticamente no canto inferior direito
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: '#00ff88' }}>3.</span>
                    Comece a receber feedbacks dos seus usuários
                  </li>
                </ol>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="w-full py-4 font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: '#00ff88',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ffaa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ff88';
                }}
              >
                Ir para Dashboard
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
