'use client';

import { useState, useCallback, useEffect } from 'react';
import { Bell, Check, MessageSquare, ThumbsUp, Bug, AlertCircle } from 'lucide-react';
import { NotificationPreferences, NotificationTypeConfig } from '@/types';

interface NotificationPreferencesProps {
  projectId: string;
}

const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  {
    type: 'nps',
    label: 'NPS',
    description: 'Notificações de avaliações NPS (0-10)',
    field: 'notify_nps',
  },
  {
    type: 'suggestion',
    label: 'Sugestões',
    description: 'Notificações de sugestões de melhoria',
    field: 'notify_suggestion',
  },
  {
    type: 'bug',
    label: 'Bugs',
    description: 'Notificações de relatórios de bugs',
    field: 'notify_bug',
  },
];

const ICONS = {
  nps: ThumbsUp,
  suggestion: MessageSquare,
  bug: Bug,
};

export function NotificationPreferencesManager({ projectId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleToggle = useCallback(async (field: 'notify_nps' | 'notify_suggestion' | 'notify_bug') => {
    if (!preferences || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

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
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  }, [preferences, projectId, saving]);

  const handleToggleAll = useCallback(async (value: boolean) => {
    if (!preferences || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/projects/${projectId}/notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notify_nps: value,
          notify_suggestion: value,
          notify_bug: value,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar preferências');
      }

      setPreferences(result.data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  }, [preferences, projectId, saving]);

  const allEnabled = preferences ? 
    preferences.notify_nps && preferences.notify_suggestion && preferences.notify_bug 
    : false;

  const anyEnabled = preferences ? 
    preferences.notify_nps || preferences.notify_suggestion || preferences.notify_bug 
    : false;

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
              Preferências de Notificação
            </h2>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Escolha quais tipos de feedback geram notificação
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
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#222222' }}>
        <div className="flex items-center gap-3">
          <Bell size={20} style={{ color: '#00ff88' }} />
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
              Preferências de Notificação
            </h2>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Escolha quais tipos de feedback geram notificação
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleAll(true)}
            disabled={saving || allEnabled}
            className="px-3 py-1 text-xs font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: allEnabled ? '#00ff8840' : '#00ff88',
              color: '#000000',
            }}
          >
            Todos
          </button>
          <button
            onClick={() => handleToggleAll(false)}
            disabled={saving || !anyEnabled}
            className="px-3 py-1 text-xs font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: '#ff4444',
              color: '#ffffff',
              opacity: !anyEnabled ? 0.5 : 1,
            }}
          >
            Nenhum
          </button>
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
          <span>Preferências salvas com sucesso!</span>
        </div>
      )}

      {/* Notification Types */}
      <div className="space-y-3">
        {NOTIFICATION_TYPES.map((config) => {
          const Icon = ICONS[config.type];
          const isEnabled = preferences?.[config.field] ?? true;

          return (
            <div
              key={config.type}
              className="flex items-center justify-between p-4 cursor-pointer transition-colors"
              style={{
                backgroundColor: isEnabled ? '#00ff8810' : '#000000',
                border: `1px solid ${isEnabled ? '#00ff88' : '#222222'}`,
              }}
              onClick={() => handleToggle(config.field)}
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
                    {config.label}
                  </span>
                  <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                    {config.description}
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
          <li>Clique em qualquer tipo para ativar/desativar notificações</li>
          <li>Use "Todos" para ativar todas as notificações</li>
          <li>Use "Nenhum" para desativar todas as notificações</li>
          <li>As alterações são salvas automaticamente</li>
        </ul>
      </div>
    </div>
  );
}
