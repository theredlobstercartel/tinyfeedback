'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, Calendar, Clock, Check, AlertCircle, Send, FileText } from 'lucide-react';
import { NotificationPreferences } from '@/types';

interface SummarySettingsManagerProps {
  projectId: string;
}

export function SummarySettingsManager({ projectId }: SummarySettingsManagerProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/notifications`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao carregar preferências');
        }

        setPreferences(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar preferências');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [projectId]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleToggle = useCallback(async (field: 'daily_summary_enabled' | 'weekly_summary_enabled') => {
    if (!preferences || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const newValue = !preferences[field];

    try {
      const response = await fetch(`/api/projects/${projectId}/notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: newValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar preferências');
      }

      setPreferences(result.data);
      setSuccess(newValue 
        ? `Resumo ${field === 'daily_summary_enabled' ? 'diário' : 'semanal'} ativado!` 
        : `Resumo ${field === 'daily_summary_enabled' ? 'diário' : 'semanal'} desativado.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  }, [preferences, projectId, saving]);

  const handleEmailChange = useCallback(async (email: string) => {
    if (!preferences || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary_email: email || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar email');
      }

      setPreferences(result.data);
      setSuccess('Email de resumo atualizado!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar email');
    } finally {
      setSaving(false);
    }
  }, [preferences, projectId, saving]);

  const handleSendTest = useCallback(async (type: 'daily' | 'weekly') => {
    if (sendingTest) return;

    setSendingTest(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/summary/send?project_id=${projectId}&type=${type}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar resumo de teste');
      }

      setSuccess(`Resumo de teste enviado para: ${result.data?.recipientEmail || 'email configurado'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar resumo de teste');
    } finally {
      setSendingTest(false);
    }
  }, [projectId, sendingTest]);

  if (loading) {
    return (
      <div 
        className="p-6 space-y-6"
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #222222',
        }}
      >
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: '#222222' }}>
          <Mail size={20} style={{ color: '#00ff88' }} />
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
              Resumo por Email
            </h2>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Configure resumos diários e semanais
            </p>
          </div>
        </div>
        <div className="space-y-4" style={{ color: '#888888' }}>
          Carregando...
        </div>
      </div>
    );
  }

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
        <Mail size={20} style={{ color: '#00ff88' }} />
        <div>
          <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
            Resumo por Email
          </h2>
          <p style={{ color: '#888888', fontSize: '0.875rem' }}>
            Configure resumos diários e semanais
          </p>
        </div>
      </div>

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

      {/* Success Message */}
      {success && (
        <div 
          className="flex items-center gap-2 p-3 text-sm"
          style={{
            backgroundColor: '#00ff8820',
            border: '1px solid #00ff88',
            color: '#00ff88',
          }}
        >
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-2">
        <label style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}>
          Email para Recebimento
        </label>
        <input
          type="email"
          placeholder="Deixe em branco para usar seu email de cadastro"
          value={preferences?.summary_email || ''}
          onChange={(e) => handleEmailChange(e.target.value)}
          disabled={saving}
          className="w-full px-3 py-2 text-sm transition-colors disabled:opacity-50"
          style={{
            backgroundColor: '#000000',
            border: '1px solid #222222',
            color: '#ffffff',
            outline: 'none',
          }}
        />
        <p style={{ color: '#888888', fontSize: '0.75rem' }}>
          Se deixado em branco, o resumo será enviado para o email da sua conta.
        </p>
      </div>

      {/* Summary Options */}
      <div className="space-y-3">
        {/* Daily Summary */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer transition-colors"
          style={{
            backgroundColor: preferences?.daily_summary_enabled ? '#00ff8810' : '#000000',
            border: `1px solid ${preferences?.daily_summary_enabled ? '#00ff88' : '#222222'}`,
          }}
          onClick={() => handleToggle('daily_summary_enabled')}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2"
              style={{
                backgroundColor: preferences?.daily_summary_enabled ? '#00ff88' : '#222222',
                color: preferences?.daily_summary_enabled ? '#000000' : '#888888',
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <span 
                style={{ 
                  color: preferences?.daily_summary_enabled ? '#00ff88' : '#ffffff',
                  fontWeight: 600,
                }}
              >
                Resumo Diário
              </span>
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                Todo dia às 9h da manhã
              </p>
            </div>
          </div>
          <div
            className="w-12 h-6 relative cursor-pointer"
            style={{
              backgroundColor: preferences?.daily_summary_enabled ? '#00ff88' : '#222222',
              transition: 'background-color 0.2s',
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 transition-all"
              style={{
                backgroundColor: '#ffffff',
                left: preferences?.daily_summary_enabled ? 'calc(100% - 20px)' : '4px',
              }}
            />
          </div>
        </div>

        {/* Weekly Summary */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer transition-colors"
          style={{
            backgroundColor: preferences?.weekly_summary_enabled ? '#00ff8810' : '#000000',
            border: `1px solid ${preferences?.weekly_summary_enabled ? '#00ff88' : '#222222'}`,
          }}
          onClick={() => handleToggle('weekly_summary_enabled')}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2"
              style={{
                backgroundColor: preferences?.weekly_summary_enabled ? '#00ff88' : '#222222',
                color: preferences?.weekly_summary_enabled ? '#000000' : '#888888',
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <span 
                style={{ 
                  color: preferences?.weekly_summary_enabled ? '#00ff88' : '#ffffff',
                  fontWeight: 600,
                }}
              >
                Resumo Semanal
              </span>
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                Toda segunda-feira às 9h da manhã
              </p>
            </div>
          </div>
          <div
            className="w-12 h-6 relative cursor-pointer"
            style={{
              backgroundColor: preferences?.weekly_summary_enabled ? '#00ff88' : '#222222',
              transition: 'background-color 0.2s',
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 transition-all"
              style={{
                backgroundColor: '#ffffff',
                left: preferences?.weekly_summary_enabled ? 'calc(100% - 20px)' : '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="space-y-3">
        <div style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}>
          Enviar Teste
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSendTest('daily')}
            disabled={sendingTest}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: '#00ff88',
              color: '#000000',
            }}
          >
            <Send size={16} />
            Resumo Diário
          </button>
          <button
            onClick={() => handleSendTest('weekly')}
            disabled={sendingTest}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: '#00ff88',
              color: '#000000',
            }}
          >
            <FileText size={16} />
            Resumo Semanal
          </button>
        </div>
      </div>

      {/* Info */}
      <div 
        className="p-3 text-xs space-y-1"
        style={{
          backgroundColor: '#000000',
          border: '1px solid #222222',
          color: '#888888',
        }}
      >
        <p style={{ color: '#00ff88' }}>O que inclui cada resumo:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Total de novos feedbacks recebidos</li>
          <li>Média de NPS e distribuição</li>
          <li>Feedback em destaque (maior NPS)</li>
          <li>Lista dos feedbacks mais recentes</li>
        </ul>
      </div>
    </div>
  );
}
