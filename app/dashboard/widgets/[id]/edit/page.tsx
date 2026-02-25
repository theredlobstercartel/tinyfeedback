'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
  LogOut,
  Loader2,
  ArrowLeft,
  Save,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Palette,
  Settings,
  Type,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

// Widget configuration interface
interface WidgetConfig {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  
  // Appearance
  primary_color: string;
  background_color: string;
  position: WidgetPosition;
  
  // Behavior
  trigger_type: TriggerType;
  trigger_value: number | null;
  animation: AnimationType;
  
  // Features
  enable_nps: boolean;
  enable_suggestions: boolean;
  enable_bugs: boolean;
  is_active: boolean;
  
  // Text customization
  title: string;
  subtitle: string | null;
  thank_you_message: string;
  placeholder_text: string;
  submit_button_text: string;
  cancel_button_text: string;
}

type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type TriggerType = 'click' | 'scroll' | 'time' | 'hover';
type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce';

const POSITIONS: { value: WidgetPosition; label: string; icon: string }[] = [
  { value: 'bottom-right', label: 'Inferior Direito', icon: '↘' },
  { value: 'bottom-left', label: 'Inferior Esquerdo', icon: '↙' },
  { value: 'top-right', label: 'Superior Direito', icon: '↗' },
  { value: 'top-left', label: 'Superior Esquerdo', icon: '↖' },
];

const TRIGGERS: { value: TriggerType; label: string; description: string }[] = [
  { value: 'click', label: 'Clique', description: 'Abre ao clicar no botão' },
  { value: 'scroll', label: 'Scroll', description: 'Abre após rolar X% da página' },
  { value: 'time', label: 'Tempo', description: 'Abre após X segundos' },
  { value: 'hover', label: 'Hover', description: 'Abre ao passar o mouse' },
];

const ANIMATIONS: { value: AnimationType; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'scale', label: 'Scale' },
  { value: 'bounce', label: 'Bounce' },
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

// Default configuration
const DEFAULT_CONFIG: WidgetConfig = {
  id: '',
  project_id: '',
  name: '',
  description: null,
  primary_color: '#00ff88',
  background_color: '#0a0a0a',
  position: 'bottom-right',
  trigger_type: 'click',
  trigger_value: null,
  animation: 'fade',
  enable_nps: true,
  enable_suggestions: true,
  enable_bugs: true,
  is_active: true,
  title: 'Queremos seu feedback!',
  subtitle: null,
  thank_you_message: 'Obrigado pelo feedback!',
  placeholder_text: 'Descreva sua experiência...',
  submit_button_text: 'Enviar',
  cancel_button_text: 'Cancelar',
};

export default function WidgetEditPage() {
  const params = useParams();
  const router = useRouter();
  const widgetId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  
  // Debounce ref for preview updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load widget configuration
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Load widget config
      try {
        const response = await fetch(`/api/widgets/${widgetId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao carregar configurações');
        }

        const loadedConfig = { ...DEFAULT_CONFIG, ...result.data };
        setConfig(loadedConfig);
        setOriginalConfig(loadedConfig);
      } catch (error) {
        console.error('Error loading widget:', error);
        toast.error('Erro ao carregar configurações do widget');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [widgetId, router]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasUnsavedChanges(hasChanges);
  }, [config, originalConfig]);

  // Handle beforeunload for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Debounced config update for preview
  const debouncedUpdate = useCallback((updater: (prev: WidgetConfig) => WidgetConfig) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setConfig(updater);
    }, 100);
  }, []);

  const updateConfig = useCallback((updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar configurações');
      }

      setOriginalConfig(config);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving widget:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (confirm('Tem certeza que deseja reverter todas as alterações?')) {
      setConfig(originalConfig);
      toast.info('Alterações revertidas');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `widget-config-${config.name || widgetId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Configurações exportadas!');
  };

  const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#00ff88' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b"
        style={{ 
          backgroundColor: '#0a0a0a', 
          borderColor: '#222222' 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="p-2 transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: '#888888',
                  border: '1px solid #333333',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00ff88';
                  e.currentTarget.style.color = '#00ff88';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333333';
                  e.currentTarget.style.color = '#888888';
                }}
              >
                <ArrowLeft size={20} />
              </a>
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: '#00ff88' }}
                >
                  Editar Widget
                </h1>
                <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                  {config.name || 'Carregando...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge 
                  variant="outline" 
                  className="hidden sm:flex items-center gap-1"
                  style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                >
                  <AlertTriangle size={12} />
                  Alterações não salvas
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevert}
                disabled={!hasUnsavedChanges || isSaving}
                className="hidden sm:flex items-center gap-2"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: hasUnsavedChanges ? '#888888' : '#333333',
                  color: hasUnsavedChanges ? '#ffffff' : '#666666',
                }}
              >
                <RotateCcw size={16} />
                Reverter
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="hidden sm:flex items-center gap-2"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: '#00d4ff',
                  color: '#00d4ff',
                }}
              >
                <Download size={16} />
                Exportar
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: hasUnsavedChanges ? '#00ff88' : '#333333',
                  color: hasUnsavedChanges ? '#000000' : '#666666',
                }}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>

              <button
                onClick={handleLogout}
                className="p-2 transition-colors ml-2"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ff4444',
                  border: '1px solid #ff4444',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasUnsavedChanges && (
          <Alert 
            className="mb-6"
            style={{ 
              backgroundColor: 'rgba(245, 158, 11, 0.1)', 
              borderColor: '#f59e8b',
              color: '#f59e0b'
            }}
          >
            <AlertTriangle size={16} />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Você tem alterações não salvas. Não se esqueça de salvar antes de sair.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div 
              className="p-4 flex items-center justify-between"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: config.is_active ? '#00ff88' : '#ff4444',
                    boxShadow: config.is_active ? '0 0 10px #00ff88' : 'none'
                  }}
                />
                <span style={{ color: '#ffffff' }}>
                  Widget {config.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#888888', fontSize: '0.875rem' }}>
                  {config.is_active ? 'Visível no site' : 'Oculto'}
                </span>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => updateConfig({ is_active: checked })}
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList 
                className="grid w-full grid-cols-3"
                style={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #222222' 
                }}
              >
                <TabsTrigger 
                  value="appearance"
                  className="flex items-center gap-2 data-[state=active]:text-black"
                  style={{ 
                    color: '#888888',
                  }}
                >
                  <Palette size={16} />
                  Aparência
                </TabsTrigger>
                <TabsTrigger 
                  value="behavior"
                  className="flex items-center gap-2 data-[state=active]:text-black"
                  style={{ color: '#888888' }}
                >
                  <Settings size={16} />
                  Comportamento
                </TabsTrigger>
                <TabsTrigger 
                  value="texts"
                  className="flex items-center gap-2 data-[state=active]:text-black"
                  style={{ color: '#888888' }}
                >
                  <Type size={16} />
                  Textos
                </TabsTrigger>
              </TabsList>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="mt-6 space-y-6">
                {/* Name */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="name" style={{ color: '#ffffff' }}>
                      Nome do Widget
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Identificação interna do widget
                    </p>
                  </div>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => updateConfig({ name: e.target.value })}
                    placeholder="Meu Widget"
                    maxLength={100}
                    className="w-full"
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Description */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="description" style={{ color: '#ffffff' }}>
                      Descrição
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Descrição interna para referência
                    </p>
                  </div>
                  <Textarea
                    id="description"
                    value={config.description || ''}
                    onChange={(e) => updateConfig({ description: e.target.value || null })}
                    placeholder="Descrição opcional..."
                    maxLength={500}
                    rows={3}
                    className="w-full resize-none"
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Primary Color */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label style={{ color: '#ffffff' }}>
                      Cor Primária
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Cor principal dos botões e elementos de destaque
                    </p>
                  </div>
                  
                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateConfig({ primary_color: color })}
                        className="w-10 h-10 transition-all"
                        style={{
                          backgroundColor: color,
                          border: config.primary_color === color ? '3px solid #ffffff' : '2px solid transparent',
                          transform: config.primary_color === color ? 'scale(1.1)' : 'scale(1)',
                        }}
                        aria-label={`Selecionar cor ${color}`}
                      />
                    ))}
                  </div>

                  {/* Custom Color Input */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => updateConfig({ primary_color: e.target.value })}
                      className="w-10 h-10 cursor-pointer border-0 p-0"
                      style={{ backgroundColor: 'transparent' }}
                    />
                    <Input
                      type="text"
                      value={config.primary_color}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isValidHexColor(value)) {
                          updateConfig({ primary_color: value });
                        }
                      }}
                      placeholder="#00ff88"
                      className="w-28"
                      style={{
                        backgroundColor: '#000000',
                        borderColor: '#333333',
                        color: '#ffffff',
                      }}
                    />
                    <span style={{ color: '#888888', fontSize: '0.875rem' }}>
                      HEX
                    </span>
                  </div>
                </div>

                {/* Background Color */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label style={{ color: '#ffffff' }}>
                      Cor de Fundo
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Cor de fundo do modal de feedback
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.background_color}
                      onChange={(e) => updateConfig({ background_color: e.target.value })}
                      className="w-10 h-10 cursor-pointer border-0 p-0"
                      style={{ backgroundColor: 'transparent' }}
                    />
                    <Input
                      type="text"
                      value={config.background_color}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isValidHexColor(value)) {
                          updateConfig({ background_color: value });
                        }
                      }}
                      placeholder="#0a0a0a"
                      className="w-28"
                      style={{
                        backgroundColor: '#000000',
                        borderColor: '#333333',
                        color: '#ffffff',
                      }}
                    />
                    <span style={{ color: '#888888', fontSize: '0.875rem' }}>
                      HEX
                    </span>
                  </div>
                </div>

                {/* Position */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label style={{ color: '#ffffff' }}>
                      Posição na Tela
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Onde o botão do widget aparecerá
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {POSITIONS.map((position) => (
                      <button
                        key={position.value}
                        onClick={() => updateConfig({ position: position.value })}
                        className="flex items-center gap-3 p-3 transition-all"
                        style={{
                          backgroundColor: config.position === position.value ? 'rgba(0, 255, 136, 0.1)' : '#000000',
                          border: `1px solid ${config.position === position.value ? '#00ff88' : '#333333'}`,
                        }}
                      >
                        <span 
                          className="text-lg"
                          style={{ 
                            color: config.position === position.value ? '#00ff88' : '#888888',
                          }}
                        >
                          {position.icon}
                        </span>
                        <span 
                          style={{ 
                            color: config.position === position.value ? '#00ff88' : '#ffffff',
                            fontSize: '0.875rem',
                          }}
                        >
                          {position.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Behavior Tab */}
              <TabsContent value="behavior" className="mt-6 space-y-6">
                {/* Trigger Type */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label style={{ color: '#ffffff' }}>
                      Gatilho de Abertura
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Como o widget será aberto
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {TRIGGERS.map((trigger) => (
                      <button
                        key={trigger.value}
                        onClick={() => updateConfig({ trigger_type: trigger.value })}
                        className="w-full flex items-center justify-between p-3 transition-all text-left"
                        style={{
                          backgroundColor: config.trigger_type === trigger.value ? 'rgba(0, 255, 136, 0.1)' : '#000000',
                          border: `1px solid ${config.trigger_type === trigger.value ? '#00ff88' : '#333333'}`,
                        }}
                      >
                        <div>
                          <span 
                            style={{ 
                              color: config.trigger_type === trigger.value ? '#00ff88' : '#ffffff',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                            }}
                          >
                            {trigger.label}
                          </span>
                          <p style={{ color: '#888888', fontSize: '0.75rem' }}>
                            {trigger.description}
                          </p>
                        </div>
                        {config.trigger_type === trigger.value && (
                          <Check size={16} style={{ color: '#00ff88' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label style={{ color: '#ffffff' }}>
                      Animação
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Estilo de animação ao abrir o widget
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {ANIMATIONS.map((animation) => (
                      <button
                        key={animation.value}
                        onClick={() => updateConfig({ animation: animation.value })}
                        className="flex items-center justify-between p-3 transition-all"
                        style={{
                          backgroundColor: config.animation === animation.value ? 'rgba(0, 255, 136, 0.1)' : '#000000',
                          border: `1px solid ${config.animation === animation.value ? '#00ff88' : '#333333'}`,
                        }}
                      >
                        <span 
                          style={{ 
                            color: config.animation === animation.value ? '#00ff88' : '#ffffff',
                            fontSize: '0.875rem',
                          }}
                        >
                          {animation.label}
                        </span>
                        {config.animation === animation.value && (
                          <Check size={16} style={{ color: '#00ff88' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature Toggles */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label style={{ color: '#ffffff' }}>
                      Tipos de Feedback
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Quais tipos de feedback serão aceitos
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          NPS (Net Promoter Score)
                        </span>
                        <p style={{ color: '#888888', fontSize: '0.75rem' }}>
                          Pesquisa de satisfação 0-10
                        </p>
                      </div>
                      <Switch
                        checked={config.enable_nps}
                        onCheckedChange={(checked) => updateConfig({ enable_nps: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          Sugestões
                        </span>
                        <p style={{ color: '#888888', fontSize: '0.75rem' }}>
                          Receber ideias e sugestões
                        </p>
                      </div>
                      <Switch
                        checked={config.enable_suggestions}
                        onCheckedChange={(checked) => updateConfig({ enable_suggestions: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                          Bugs
                        </span>
                        <p style={{ color: '#888888', fontSize: '0.75rem' }}>
                          Reportar problemas técnicos
                        </p>
                      </div>
                      <Switch
                        checked={config.enable_bugs}
                        onCheckedChange={(checked) => updateConfig({ enable_bugs: checked })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Texts Tab */}
              <TabsContent value="texts" className="mt-6 space-y-6">
                {/* Title */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="title" style={{ color: '#ffffff' }}>
                      Título do Widget
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Título exibido no modal de feedback
                    </p>
                  </div>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => updateConfig({ title: e.target.value })}
                    placeholder="Queremos seu feedback!"
                    maxLength={100}
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Subtitle */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="subtitle" style={{ color: '#ffffff' }}>
                      Subtítulo
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Texto secundário abaixo do título
                    </p>
                  </div>
                  <Input
                    id="subtitle"
                    value={config.subtitle || ''}
                    onChange={(e) => updateConfig({ subtitle: e.target.value || null })}
                    placeholder="Sua opinião é importante para nós"
                    maxLength={200}
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Thank You Message */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="thank_you_message" style={{ color: '#ffffff' }}>
                      Mensagem de Agradecimento
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Mensagem exibida após enviar o feedback
                    </p>
                  </div>
                  <Textarea
                    id="thank_you_message"
                    value={config.thank_you_message}
                    onChange={(e) => updateConfig({ thank_you_message: e.target.value })}
                    placeholder="Obrigado pelo feedback!"
                    maxLength={200}
                    rows={2}
                    className="resize-none"
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Placeholder */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="placeholder_text" style={{ color: '#ffffff' }}>
                      Placeholder do Campo de Texto
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Texto de dica no campo de descrição
                    </p>
                  </div>
                  <Input
                    id="placeholder_text"
                    value={config.placeholder_text}
                    onChange={(e) => updateConfig({ placeholder_text: e.target.value })}
                    placeholder="Descreva sua experiência..."
                    maxLength={200}
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Submit Button */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="submit_button_text" style={{ color: '#ffffff' }}>
                      Texto do Botão Enviar
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Texto do botão de envio do feedback
                    </p>
                  </div>
                  <Input
                    id="submit_button_text"
                    value={config.submit_button_text}
                    onChange={(e) => updateConfig({ submit_button_text: e.target.value })}
                    placeholder="Enviar"
                    maxLength={50}
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {/* Cancel Button */}
                <div 
                  className="p-6 space-y-4"
                  style={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #222222' 
                  }}
                >
                  <div>
                    <Label htmlFor="cancel_button_text" style={{ color: '#ffffff' }}>
                      Texto do Botão Cancelar
                    </Label>
                    <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                      Texto do botão de cancelar
                    </p>
                  </div>
                  <Input
                    id="cancel_button_text"
                    value={config.cancel_button_text}
                    onChange={(e) => updateConfig({ cancel_button_text: e.target.value })}
                    placeholder="Cancelar"
                    maxLength={50}
                    style={{
                      backgroundColor: '#000000',
                      borderColor: '#333333',
                      color: '#ffffff',
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div 
                className="p-4"
                style={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #222222' 
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Eye size={18} style={{ color: '#00ff88' }} />
                  <h3 style={{ color: '#ffffff', fontWeight: 600 }}>
                    Preview ao Vivo
                  </h3>
                </div>
                <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                  Veja como o widget ficará no seu site
                </p>
              </div>

              {/* Preview Container */}
              <div 
                className="relative overflow-hidden"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #333333',
                  height: '500px',
                }}
              >
                {/* Mock Website Background */}
                <div className="p-4 space-y-3 opacity-30">
                  <div className="h-4 w-3/4" style={{ backgroundColor: '#333333' }} />
                  <div className="h-4 w-1/2" style={{ backgroundColor: '#333333' }} />
                  <div className="h-32 w-full mt-4" style={{ backgroundColor: '#222222' }} />
                  <div className="h-32 w-full" style={{ backgroundColor: '#222222' }} />
                  <div className="h-4 w-2/3 mt-4" style={{ backgroundColor: '#333333' }} />
                  <div className="h-4 w-1/2" style={{ backgroundColor: '#333333' }} />
                </div>

                {/* Widget Button */}
                <div
                  className="absolute px-4 py-3 font-medium text-sm transition-all cursor-pointer"
                  style={{
                    backgroundColor: config.is_active ? config.primary_color : '#666666',
                    color: '#000000',
                    opacity: config.is_active ? 1 : 0.5,
                    ...(config.position === 'bottom-right' && { right: '16px', bottom: '16px' }),
                    ...(config.position === 'bottom-left' && { left: '16px', bottom: '16px' }),
                    ...(config.position === 'top-right' && { right: '16px', top: '16px' }),
                    ...(config.position === 'top-left' && { left: '16px', top: '16px' }),
                    animation: config.animation === 'bounce' ? 'bounce 2s infinite' : 'none',
                  }}
                >
                  {config.title || 'Feedback'}
                </div>

                {/* Widget Modal Preview */}
                {config.is_active && (
                  <div 
                    className="absolute inset-8 p-4 flex flex-col"
                    style={{
                      backgroundColor: config.background_color,
                      border: `1px solid ${config.primary_color}40`,
                      animation: `${config.animation}In 0.3s ease-out`,
                    }}
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 style={{ color: config.primary_color, fontWeight: 600 }}>
                          {config.title}
                        </h4>
                        {config.subtitle && (
                          <p style={{ color: '#888888', fontSize: '0.75rem' }}>
                            {config.subtitle}
                          </p>
                        )}
                      </div>
                      <button style={{ color: '#888888' }}>✕</button>
                    </div>

                    {/* Feedback Type Tabs */}
                    <div className="flex gap-2 mb-4">
                      {config.enable_nps && (
                        <span 
                          className="px-3 py-1 text-xs"
                          style={{ 
                            backgroundColor: `${config.primary_color}20`,
                            color: config.primary_color,
                            border: `1px solid ${config.primary_color}40`,
                          }}
                        >
                          NPS
                        </span>
                      )}
                      {config.enable_suggestions && (
                        <span 
                          className="px-3 py-1 text-xs"
                          style={{ 
                            backgroundColor: '#333333',
                            color: '#888888',
                          }}
                        >
                          Sugestão
                        </span>
                      )}
                      {config.enable_bugs && (
                        <span 
                          className="px-3 py-1 text-xs"
                          style={{ 
                            backgroundColor: '#333333',
                            color: '#888888',
                          }}
                        >
                          Bug
                        </span>
                      )}
                    </div>

                    {/* NPS Score */}
                    {config.enable_nps && (
                      <div className="flex gap-1 mb-4">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            className="w-6 h-6 text-xs flex items-center justify-center"
                            style={{
                              backgroundColor: score >= 7 ? `${config.primary_color}30` : '#333333',
                              color: score >= 7 ? config.primary_color : '#888888',
                            }}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Text Input */}
                    <div 
                      className="flex-1 p-3 mb-4 text-sm"
                      style={{
                        backgroundColor: '#000000',
                        border: '1px solid #333333',
                        color: '#666666',
                      }}
                    >
                      {config.placeholder_text}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 text-sm font-medium"
                        style={{
                          backgroundColor: config.primary_color,
                          color: '#000000',
                        }}
                      >
                        {config.submit_button_text}
                      </button>
                      <button
                        className="px-4 py-2 text-sm"
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #444444',
                          color: '#888888',
                        }}
                      >
                        {config.cancel_button_text}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inactive Overlay */}
                {!config.is_active && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                  >
                    <div className="text-center">
                      <EyeOff size={48} style={{ color: '#444444', margin: '0 auto 1rem' }} />
                      <p style={{ color: '#666666' }}>
                        Widget inativo
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div 
                className="p-4 space-y-3"
                style={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #222222' 
                }}
              >
                <h4 style={{ color: '#ffffff', fontWeight: 500 }}>
                  Resumo
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#888888' }}>Posição:</span>
                    <span style={{ color: '#ffffff' }}>
                      {POSITIONS.find(p => p.value === config.position)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#888888' }}>Gatilho:</span>
                    <span style={{ color: '#ffffff' }}>
                      {TRIGGERS.find(t => t.value === config.trigger_type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#888888' }}>Animação:</span>
                    <span style={{ color: '#ffffff' }}>
                      {ANIMATIONS.find(a => a.value === config.animation)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#888888' }}>Tipos:</span>
                    <span style={{ color: '#ffffff' }}>
                      {[
                        config.enable_nps && 'NPS',
                        config.enable_suggestions && 'Sug.',
                        config.enable_bugs && 'Bug'
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Keyframe Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
