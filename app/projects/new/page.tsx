'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{ id: string; name: string; api_key: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          user_id: user?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar projeto');
      }

      setCreatedProject(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    if (createdProject?.api_key) {
      navigator.clipboard.writeText(createdProject.api_key);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoToSettings = () => {
    router.push('/settings');
  };

  // Success state - project created
  if (createdProject) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 
              className="text-3xl font-bold neon-text"
              style={{ color: '#00ff88' }}
            >
              Projeto Criado! 🎉
            </h1>
            <p style={{ color: '#888888' }}>
              Seu projeto foi criado com sucesso
            </p>
          </div>

          {/* Success Card */}
          <div 
            className="p-6 space-y-6"
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #00ff88',
            }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={24} style={{ color: '#00ff88' }} />
              <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
                {createdProject.name}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#888888' }}
                >
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createdProject.api_key}
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
                    className="px-6 py-3 font-medium transition-colors"
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
                    Copiar
                  </button>
                </div>
                <p className="mt-2 text-xs" style={{ color: '#888888' }}>
                  Guarde esta chave em um local seguro. Você também pode encontrá-la nas configurações do projeto.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleGoToDashboard}
              className="px-6 py-3 font-medium transition-colors"
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
            </button>
            <button
              onClick={handleGoToSettings}
              className="px-6 py-3 font-medium transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#00ff88',
                border: '1px solid #00ff88',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Configurações do Projeto
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Novo Projeto
          </h1>
          <p style={{ color: '#888888' }}>
            Crie um novo projeto para coletar feedbacks dos seus usuários
          </p>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #222222',
          }}
        >
          {/* Error Message */}
          {error && (
            <div 
              className="flex items-center gap-2 p-3 text-sm"
              style={{
                backgroundColor: '#ff444420',
                border: '1px solid #ff4444',
                color: '#ff4444',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <label 
              htmlFor="name"
              className="block text-sm font-medium"
              style={{ color: '#ffffff' }}
            >
              Nome do Projeto <span style={{ color: '#ff4444' }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meu Produto Incrível"
              required
              minLength={3}
              maxLength={100}
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-50"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
                color: '#ffffff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#222222';
              }}
            />
            <p className="text-xs" style={{ color: '#888888' }}>
              Mínimo 3 caracteres, máximo 100
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label 
              htmlFor="description"
              className="block text-sm font-medium"
              style={{ color: '#ffffff' }}
            >
              Descrição <span style={{ color: '#888888' }}>(opcional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu projeto em poucas palavras..."
              rows={4}
              maxLength={500}
              disabled={isLoading}
              className="w-full px-4 py-3 text-sm focus:outline-none transition-colors resize-none disabled:opacity-50"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
                color: '#ffffff',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#222222';
              }}
            />
            <div className="flex justify-between text-xs" style={{ color: '#888888' }}>
              <span>Ajuda a identificar o projeto no dashboard</span>
              <span>{description.length}/500</span>
            </div>
          </div>

          {/* Info Box */}
          <div 
            className="p-4 text-sm flex items-start gap-3"
            style={{
              backgroundColor: 'rgba(0, 255, 136, 0.05)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
            }}
          >
            <Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#00ff88' }} />
            <div style={{ color: '#888888' }}>
              <p style={{ color: '#00ff88', marginBottom: '0.25rem' }}>
                O que acontece depois?
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Uma API key única será gerada automaticamente</li>
                <li>Você poderá usar esta chave no widget do TinyFeedback</li>
                <li>A chave também estará disponível nas configurações do projeto</li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || name.trim().length < 3}
              className="w-full px-6 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: isLoading ? '#00ff8840' : '#00ff88',
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                if (!isLoading && name.trim().length >= 3) {
                  e.currentTarget.style.backgroundColor = '#00ffaa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#00ff88';
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Criando Projeto...
                </>
              ) : (
                'Criar Projeto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
