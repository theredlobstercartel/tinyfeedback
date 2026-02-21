'use client';

import { useState, useCallback } from 'react';
import { Feedback } from '@/types';
import { Save, X, FileText, Image, Globe, Monitor, Mail, Calendar, Bug, MessageSquare, Star } from 'lucide-react';

interface FeedbackDetailProps {
  feedback: Feedback;
  onClose: () => void;
  onUpdate?: (updatedFeedback: Feedback) => void;
}

export function FeedbackDetail({ feedback, onClose, onUpdate }: FeedbackDetailProps) {
  const [internalNotes, setInternalNotes] = useState(feedback.internal_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  const handleSaveNotes = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/feedbacks/${feedback.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internal_notes: internalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save notes');
      }

      const { data } = await response.json();
      setSaveStatus('success');
      onUpdate?.(data);

      // Clear success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  }, [feedback.id, internalNotes, onUpdate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#00d4ff';
      case 'read':
        return '#ffd700';
      case 'responded':
        return '#00ff88';
      case 'archived':
        return '#666666';
      default:
        return '#888888';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Novo';
      case 'read':
        return 'Lido';
      case 'responded':
        return 'Respondido';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'bug':
        return {
          color: '#ff4444',
          bgColor: 'rgba(255, 68, 68, 0.1)',
          icon: Bug,
          label: 'Bug',
        };
      case 'suggestion':
        return {
          color: '#00d4ff',
          bgColor: 'rgba(0, 212, 255, 0.1)',
          icon: MessageSquare,
          label: 'Sugestão',
        };
      case 'nps':
        return {
          color: '#00ff88',
          bgColor: 'rgba(0, 255, 136, 0.1)',
          icon: Star,
          label: 'NPS',
        };
      default:
        return {
          color: '#888888',
          bgColor: 'rgba(136, 136, 136, 0.1)',
          icon: MessageSquare,
          label: type,
        };
    }
  };

  const typeConfig = getTypeConfig(feedback.type);
  const TypeIcon = typeConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
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
            {/* Type Badge */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.color,
                border: `1px solid ${typeConfig.color}`,
              }}
            >
              <TypeIcon size={16} />
              {typeConfig.label}
            </div>

            {/* Status Badge */}
            <span
              className="px-3 py-1.5 text-xs font-mono uppercase"
              style={{
                backgroundColor: `${getStatusColor(feedback.status)}20`,
                color: getStatusColor(feedback.status),
                border: `1px solid ${getStatusColor(feedback.status)}`,
              }}
            >
              {getStatusLabel(feedback.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors hover:bg-white/5"
            style={{ color: '#888888' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          {feedback.title && (
            <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
              {feedback.title}
            </h2>
          )}

          {/* Main Content */}
          <div className="space-y-2">
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Conteúdo do Feedback
            </p>
            <div
              className="p-4 text-sm"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
                color: '#ffffff',
                whiteSpace: 'pre-wrap',
              }}
            >
              {feedback.content}
            </div>
          </div>

          {/* NPS Score */}
          {feedback.nps_score !== null && feedback.nps_score !== undefined && (
            <div className="space-y-2">
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                NPS Score
              </p>
              <div
                className="inline-flex items-center justify-center w-12 h-12 text-xl font-bold"
                style={{
                  backgroundColor: feedback.nps_score >= 7 ? '#00ff8820' : '#ff444420',
                  border: `1px solid ${feedback.nps_score >= 7 ? '#00ff88' : '#ff4444'}`,
                  color: feedback.nps_score >= 7 ? '#00ff88' : '#ff4444',
                }}
              >
                {feedback.nps_score}
              </div>
              <span style={{ color: '#888888', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                / 10
              </span>
            </div>
          )}

          {/* Screenshot for Bug Reports */}
          {feedback.type === 'bug' && feedback.screenshot_url && !imageError && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Image size={16} style={{ color: '#ff4444' }} />
                <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                  Screenshot do Bug
                </p>
              </div>
              <div
                style={{
                  backgroundColor: '#000000',
                  border: '1px solid #222222',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={feedback.screenshot_url}
                  alt="Screenshot do bug"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                  onError={() => setImageError(true)}
                />
              </div>
            </div>
          )}

          {/* Feedback Details Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t"
            style={{ borderColor: '#222222' }}
          >
            {/* Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: '#00d4ff' }} />
                <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                  Data
                </p>
              </div>
              <p style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                {formatDate(feedback.created_at)}
              </p>
            </div>

            {/* Email */}
            {feedback.user_email && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail size={14} style={{ color: '#00ff88' }} />
                  <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                    Email do Usuário
                  </p>
                </div>
                <p style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                  {feedback.user_email}
                </p>
              </div>
            )}

            {/* Page URL */}
            {feedback.page_url && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe size={14} style={{ color: '#ffd700' }} />
                  <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                    Página
                  </p>
                </div>
                <a
                  href={feedback.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#00ff88', fontSize: '0.875rem' }}
                  className="hover:underline break-all"
                >
                  {feedback.page_url}
                </a>
              </div>
            )}

            {/* User Agent */}
            {feedback.user_agent && (
              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Monitor size={14} style={{ color: '#888888' }} />
                  <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                    User Agent
                  </p>
                </div>
                <p
                  style={{ color: '#aaaaaa', fontSize: '0.75rem', fontFamily: 'monospace' }}
                  className="break-all"
                >
                  {feedback.user_agent}
                </p>
              </div>
            )}
          </div>

          {/* Internal Notes Section */}
          <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#222222' }}>
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: '#00ff88' }} />
              <h3 style={{ color: '#ffffff', fontWeight: 500 }}>
                Notas Internas
              </h3>
              <span
                className="px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: '#00ff8820',
                  color: '#00ff88',
                  border: '1px solid #00ff88',
                }}
              >
                PRIVADO
              </span>
            </div>

            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Adicione notas privadas sobre este feedback..."
              className="w-full p-3 text-sm resize-none focus:outline-none transition-colors"
              style={{
                backgroundColor: '#000000',
                border: '1px solid #222222',
                color: '#ffffff',
                minHeight: '120px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#222222';
              }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveStatus === 'success' && (
                  <span style={{ color: '#00ff88', fontSize: '0.875rem' }}>
                    Salvo com sucesso!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span style={{ color: '#ff4444', fontSize: '0.875rem' }}>
                    Erro: {errorMessage}
                  </span>
                )}
              </div>

              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSaving ? '#00ff8840' : '#00ff88',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = '#00ffaa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = '#00ff88';
                  }
                }}
              >
                <Save size={16} />
                {isSaving ? 'Salvando...' : 'Salvar Notas'}
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div
            className="pt-4 border-t text-xs space-y-1"
            style={{ borderColor: '#222222', color: '#666666' }}
          >
            <p>ID: {feedback.id}</p>
            <p>Criado em: {new Date(feedback.created_at).toLocaleString('pt-BR')}</p>
            <p>Atualizado em: {new Date(feedback.updated_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
