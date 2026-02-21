'use client';

import { useState } from 'react';
import { X, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Get current session for the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao criar projeto');
      }

      setSuccess(true);
      
      // Reset form after short delay and close
      setTimeout(() => {
        setName('');
        setDescription('');
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setDescription('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-md p-6 relative"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 transition-colors"
          style={{ 
            color: '#666666',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#666666';
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: '#00ff88' }}
          >
            <Plus size={24} />
            Criar Novo Projeto
          </h2>
          <p style={{ color: '#888888', marginTop: '0.5rem' }}>
            Preencha os dados abaixo para criar um novo projeto.
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div 
            className="p-6 text-center"
            style={{ 
              backgroundColor: 'rgba(0, 255, 136, 0.1)', 
              border: '1px solid #00ff88' 
            }}
          >
            <CheckCircle2 size={48} style={{ color: '#00ff88', margin: '0 auto 1rem' }} />
            <p style={{ color: '#00ff88', fontWeight: 600 }}>
              Projeto criado com sucesso!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label 
                htmlFor="project-name" 
                className="block text-sm font-medium mb-1"
                style={{ color: '#ffffff' }}
              >
                Nome do Projeto *
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Meu Site"
                disabled={isLoading}
                required
                minLength={3}
                maxLength={100}
                className="w-full px-4 py-2 transition-colors"
                style={{
                  backgroundColor: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00ff88';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#333333';
                }}
              />
              <p className="mt-1 text-xs" style={{ color: '#666666' }}>
                Mínimo 3 caracteres, máximo 100.
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label 
                htmlFor="project-description" 
                className="block text-sm font-medium mb-1"
                style={{ color: '#ffffff' }}
              >
                Descrição (opcional)
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição do projeto..."
                disabled={isLoading}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2 transition-colors resize-none"
                style={{
                  backgroundColor: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00ff88';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#333333';
                }}
              />
              <p className="mt-1 text-xs" style={{ color: '#666666' }}>
                Máximo 500 caracteres.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 text-sm"
                style={{ 
                  backgroundColor: 'rgba(255, 68, 68, 0.1)', 
                  border: '1px solid #ff4444',
                  color: '#ff4444' 
                }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 font-medium transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: '#888888',
                  border: '1px solid #444444',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#666666';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#888888';
                  e.currentTarget.style.borderColor = '#444444';
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || name.trim().length < 3}
                className="flex-1 px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#00ff88',
                  color: '#000000',
                  border: '1px solid #00ff88',
                  opacity: isLoading || name.trim().length < 3 ? 0.5 : 1,
                  cursor: isLoading || name.trim().length < 3 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && name.trim().length >= 3) {
                    e.currentTarget.style.backgroundColor = '#00ffaa';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ff88';
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Criar Projeto
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
