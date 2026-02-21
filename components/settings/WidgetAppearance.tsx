'use client';

import { useState, useCallback, useEffect } from 'react';
import { Palette, Layout, Type, Check, AlertCircle } from 'lucide-react';

interface WidgetAppearanceSettingsProps {
  projectId: string;
}

type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface WidgetSettings {
  widget_color: string;
  widget_position: WidgetPosition;
  widget_text: string;
}

const POSITIONS: { value: WidgetPosition; label: string; icon: string }[] = [
  { value: 'bottom-right', label: 'Inferior Direito', icon: '↘' },
  { value: 'bottom-left', label: 'Inferior Esquerdo', icon: '↙' },
  { value: 'top-right', label: 'Superior Direito', icon: '↗' },
  { value: 'top-left', label: 'Superior Esquerdo', icon: '↖' },
];

const PRESET_COLORS = [
  '#00ff88', // Neon Green (default)
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#ffffff', // White
];

export function WidgetAppearanceSettings({ projectId }: WidgetAppearanceSettingsProps) {
  const [settings, setSettings] = useState<WidgetSettings>({
    widget_color: '#00ff88',
    widget_position: 'bottom-right',
    widget_text: 'Feedback',
  });
  const [originalSettings, setOriginalSettings] = useState<WidgetSettings>({
    widget_color: '#00ff88',
    widget_position: 'bottom-right',
    widget_text: 'Feedback',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/widget-appearance`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao carregar configurações');
        }

        const loadedSettings = {
          widget_color: result.data.widget_color || '#00ff88',
          widget_position: result.data.widget_position || 'bottom-right',
          widget_text: result.data.widget_text || 'Feedback',
        };

        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [projectId]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/projects/${projectId}/widget-appearance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar configurações');
      }

      setOriginalSettings(settings);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }, [settings, projectId]);

  const handleColorChange = useCallback((color: string) => {
    setSettings(prev => ({ ...prev, widget_color: color }));
  }, []);

  const handlePositionChange = useCallback((position: WidgetPosition) => {
    setSettings(prev => ({ ...prev, widget_position: position }));
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setSettings(prev => ({ ...prev, widget_text: text }));
  }, []);

  const hasChanges = 
    settings.widget_color !== originalSettings.widget_color ||
    settings.widget_position !== originalSettings.widget_position ||
    settings.widget_text !== originalSettings.widget_text;

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
          <Palette size={20} style={{ color: '#00ff88' }} />
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
              Aparência do Widget
            </h2>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Customize a aparência do seu widget de feedback
            </p>
          </div>
        </div>
        <div style={{ color: '#888888' }}>Carregando...</div>
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
          <Palette size={20} style={{ color: '#00ff88' }} />
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600 }}>
              Aparência do Widget
            </h2>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Customize a aparência do seu widget de feedback
            </p>
          </div>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: saving ? '#00ff8840' : '#00ff88',
              color: '#000000',
            }}
          >
            <Check size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        )}
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
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Color Picker Section - AC-01 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette size={16} style={{ color: '#00ff88' }} />
          <label style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600 }}>
            Cor do Widget
          </label>
        </div>
        
        {/* Preset Colors */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className="w-10 h-10 transition-all"
              style={{
                backgroundColor: color,
                border: settings.widget_color === color ? '2px solid #ffffff' : '2px solid transparent',
                transform: settings.widget_color === color ? 'scale(1.1)' : 'scale(1)',
              }}
              aria-label={`Selecionar cor ${color}`}
            />
          ))}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.widget_color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-10 cursor-pointer border-0 p-0"
            style={{ backgroundColor: 'transparent' }}
          />
          <input
            type="text"
            value={settings.widget_color}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#00ff88"
            className="px-3 py-2 text-sm w-24 focus:outline-none"
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
          <span style={{ color: '#888888', fontSize: '0.75rem' }}>
            Código HEX
          </span>
        </div>
      </div>

      {/* Position Selector Section - AC-02 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout size={16} style={{ color: '#00ff88' }} />
          <label style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600 }}>
            Posição do Widget
          </label>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {POSITIONS.map((position) => (
            <button
              key={position.value}
              onClick={() => handlePositionChange(position.value)}
              className="flex items-center gap-3 p-3 transition-all"
              style={{
                backgroundColor: settings.widget_position === position.value ? '#00ff8810' : '#000000',
                border: `1px solid ${settings.widget_position === position.value ? '#00ff88' : '#222222'}`,
              }}
            >
              <span 
                className="text-lg"
                style={{ 
                  color: settings.widget_position === position.value ? '#00ff88' : '#888888',
                }}
              >
                {position.icon}
              </span>
              <span 
                style={{ 
                  color: settings.widget_position === position.value ? '#00ff88' : '#ffffff',
                  fontSize: '0.875rem',
                }}
              >
                {position.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Text Input Section - AC-03 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type size={16} style={{ color: '#00ff88' }} />
          <label style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600 }}>
            Texto do Botão
          </label>
        </div>
        
        <input
          type="text"
          value={settings.widget_text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Feedback"
          maxLength={50}
          className="w-full px-4 py-3 text-sm focus:outline-none"
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
        <div className="flex justify-between">
          <span style={{ color: '#888888', fontSize: '0.75rem' }}>
            Este texto aparecerá no botão do widget
          </span>
          <span style={{ color: '#888888', fontSize: '0.75rem' }}>
            {settings.widget_text.length}/50
          </span>
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-3 pt-4 border-t" style={{ borderColor: '#222222' }}>
        <label style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600 }}>
          Preview
        </label>
        
        <div 
          className="relative p-8 overflow-hidden"
          style={{
            backgroundColor: '#000000',
            border: '1px solid #222222',
            minHeight: '120px',
          }}
        >
          {/* Widget Preview Button */}
          <div
            className="absolute px-4 py-2 font-medium text-sm transition-all"
            style={{
              backgroundColor: settings.widget_color,
              color: '#000000',
              ...(settings.widget_position === 'bottom-right' && { right: '16px', bottom: '16px' }),
              ...(settings.widget_position === 'bottom-left' && { left: '16px', bottom: '16px' }),
              ...(settings.widget_position === 'top-right' && { right: '16px', top: '16px' }),
              ...(settings.widget_position === 'top-left' && { left: '16px', top: '16px' }),
            }}
          >
            {settings.widget_text || 'Feedback'}
          </div>
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
          <li>Escolha uma cor que combine com o design do seu site</li>
          <li>A posição padrão é inferior direito (mais visível)</li>
          <li>Use um texto curto e direto para o botão</li>
          <li>O preview mostra como ficará no seu site</li>
        </ul>
      </div>
    </div>
  );
}
