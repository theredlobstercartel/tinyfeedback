'use client';

import { useState, useCallback } from 'react';
import { X, Lightbulb, Send, AlertCircle } from 'lucide-react';

interface SuggestionModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  description: string;
}

interface FormErrors {
  title?: string;
  general?: string;
}

export function SuggestionModal({ projectId, isOpen, onClose, onSuccess }: SuggestionModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Title is required for suggestions
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.title]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrors({});

    try {
      const response = await fetch('/api/widget/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          type: 'suggestion',
          title: formData.title.trim(),
          content: formData.description.trim() || 'No description provided',
          page_url: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit suggestion');
      }

      setSubmitStatus('success');
      
      // Reset form
      setFormData({ title: '', description: '' });

      // Call success callback after a brief delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      setSubmitStatus('error');
      setErrors({
        general: error instanceof Error ? error.message : 'Erro ao enviar sugestão. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, projectId, validateForm, onClose, onSuccess]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #222222',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: '#222222' }}
        >
          <div className="flex items-center gap-3">
            <Lightbulb size={20} style={{ color: '#00ff88' }} />
            <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
              Enviar Sugestão
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: '#888888' }}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success State */}
        {submitStatus === 'success' ? (
          <div className="p-8 text-center space-y-4">
            <div
              className="w-16 h-16 mx-auto flex items-center justify-center"
              style={{
                backgroundColor: '#00ff8820',
                border: '1px solid #00ff88',
              }}
            >
              <Lightbulb size={32} style={{ color: '#00ff88' }} />
            </div>
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
              Sugestão Enviada!
            </h3>
            <p style={{ color: '#888888' }}>
              Obrigado por nos ajudar a melhorar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* General Error */}
            {errors.general && (
              <div
                className="flex items-center gap-2 p-3 text-sm"
                style={{
                  backgroundColor: '#ff444420',
                  border: '1px solid #ff4444',
                  color: '#ff4444',
                }}
              >
                <AlertCircle size={16} />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Title Field */}
            <div className="space-y-2">
              <label
                htmlFor="suggestion-title"
                style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}
              >
                Título <span style={{ color: '#00ff88' }}>*</span>
              </label>
              <input
                id="suggestion-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Adicionar modo escuro"
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                style={{
                  backgroundColor: '#000000',
                  border: `1px solid ${errors.title ? '#ff4444' : '#222222'}`,
                  color: '#ffffff',
                }}
                onFocus={(e) => {
                  if (!errors.title) {
                    e.currentTarget.style.borderColor = '#00ff88';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.title) {
                    e.currentTarget.style.borderColor = '#222222';
                  }
                }}
              />
              {errors.title && (
                <p style={{ color: '#ff4444', fontSize: '0.75rem' }}>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label
                htmlFor="suggestion-description"
                style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}
              >
                Descrição <span style={{ color: '#888888' }}>(opcional)</span>
              </label>
              <textarea
                id="suggestion-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva sua sugestão em detalhes..."
                disabled={isSubmitting}
                rows={4}
                className="w-full px-3 py-2 text-sm resize-none transition-colors focus:outline-none disabled:opacity-50"
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSubmitting ? '#00ff8840' : '#00ff88',
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#00ffaa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#00ff88';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin"
                    style={{ borderRadius: '50%' }}
                  />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Enviar Sugestão</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
