'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, Bell, Zap, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { NotificationPreferences } from '@/types';

interface NotificationSettingsProps {
  projectId: string;
}

interface FrequencyOption {
  id: 'instant' | 'daily' | 'weekly';
  label: string;
  description: string;
  field: 'instant_notifications_enabled' | 'daily_summary_enabled' | 'weekly_summary_enabled';
  icon: typeof Zap;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    id: 'instant',
    label: 'Instantâneo',
    description: 'Receba notificações imediatamente quando houver novo feedback',
    field: 'instant_notifications_enabled',
    icon: Zap,
  },
  {
    id: 'daily',
    label: 'Diário',
    description: 'Resumo diário às 9h da manhã',
    field: 'daily_summary_enabled',
    icon: Clock,
  },
  {
    id: 'weekly',
    label: 'Semanal',
    description: 'Resumo toda segunda-feira às 9h da manhã',
    field: 'weekly_summary_enabled',
    icon: Calendar,
  },
];

export function NotificationSettings({ projectId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');

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
        setEmail(result.data.summary_email || '');
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

  const handleToggle = useCallback(async (
    field: 'instant_notifications_enabled' | 'daily_summary_enabled' | 'weekly_summary_enabled'
  ) => {
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
      const optionLabel = FREQUENCY_OPTIONS.find(opt => opt.field === field)?.label || '';
      setSuccess(`Notificação ${optionLabel} ${newValue ? 'ativada' : 'desativada'}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  }, [preferences, projectId, saving]);

  const handleEmailSave = useCallback(async () => {
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
      setSuccess('Email de notificação salvo com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar email');
    } finally {
      setSaving(false);
    }
  }, [preferences, projectId, saving, email]);

  const handleEmailBlur = useCallback(() => {
    if (email !== (preferences?.summary_email || '')) {
      handleEmailSave();
    }
  }, [email, preferences?.summary_email, handleEmailSave]);

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
          <Bell size={20} style={{ color: '#00ff88' }} />
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
              Notificações por Email
            </h2>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Configure suas preferências de notificação
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
        <Bell size={20} style={{ color: '#00ff88' }} />
        <div>
          <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
            Notificações por Email
          </h2>
          <p style={{ color: '#888888', fontSize: '0.875rem' }}>
            Configure suas preferências de notificação
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

      {/* Frequency Toggles */}
      <div className="space-y-4">
        <h3 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}>
          Frequência de Notificações
        </h3>
        <div className="space-y-3">
          {FREQUENCY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isEnabled = preferences?.[option.field] ?? (option.id === 'instant');

            return (
              <div
                key={option.id}
                className="flex items-center justify-between p-4 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isEnabled ? '#00ff8810' : '#000000',
                  border: `1px solid ${isEnabled ? '#00ff88' : '#222222'}`,
                }}
                onClick={() => handleToggle(option.field)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2"
                    style={{
                      backgroundColor: isEnabled ? '#00ff88' : '#222222',
                      color: isEnabled ? '#000000' : '#888888',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <span 
                      style={{ 
                        color: isEnabled ? '#00ff88' : '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      {option.label}
                    </span>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      {option.description}
                    </p>
                  </div>
                </div>
                <div
                  className="w-12 h-6 relative cursor-pointer"
                  style={{
                    backgroundColor: isEnabled ? '#00ff88' : '#222222',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 transition-all"
                    style={{
                      backgroundColor: '#ffffff',
                      left: isEnabled ? 'calc(100% - 20px)' : '4px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email Input */}
      <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#222222' }}>
        <div className="flex items-center gap-2">
          <Mail size={18} style={{ color: '#00ff88' }} />
          <h3 style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 500 }}>
            Email de Destino
          </h3>
        </div>
        <div className="space-y-2">
          <input
            type="email"
            placeholder="Digite o email para receber notificações"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
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
            Se deixado em branco, as notificações serão enviadas para o email da sua conta.
          </p>
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
        <p style={{ color: '#00ff88' }}>Dicas:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><strong style={{ color: '#ffffff' }}>Instantâneo:</strong> Receba email imediatamente ao receber feedback</li>
          <li><strong style={{ color: '#ffffff' }}>Diário:</strong> Resumo consolidado todo dia às 9h</li>
          <li><strong style={{ color: '#ffffff' }}>Semanal:</strong> Resumo consolidado toda segunda às 9h</li>
          <li>Você pode ativar múltiplas frequências simultaneamente</li>
        </ul>
      </div>
    </div>
  );
}
