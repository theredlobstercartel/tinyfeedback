import { DomainManager, NotificationPreferencesManager } from '@/components/settings';

// Demo project ID for testing
const DEMO_PROJECT_ID = '550e8400-e29b-41d4-a716-446655440001';

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 
            className="text-3xl font-bold neon-text"
            style={{ color: '#00ff88' }}
          >
            Configurações
          </h1>
          <p style={{ color: '#888888' }}>
            Gerencie as configurações do seu projeto
          </p>
        </div>

        {/* Notification Preferences - ST-28 */}
        <NotificationPreferencesManager 
          projectId={DEMO_PROJECT_ID}
        />

        {/* Domain Manager */}
        <DomainManager 
          projectId={DEMO_PROJECT_ID}
          initialDomains={[]}
        />

        {/* Status Card */}
        <div 
          className="p-4 text-sm"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222',
            color: '#888888'
          }}
        >
          <h3 className="mb-3" style={{ color: '#ffffff' }}>Status da Implementação:</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li style={{ color: '#00ff88' }}>✅ ST-28: Preferências de Notificação - Implementado</li>
            <li style={{ color: '#00ff88' }} className="ml-4">- AC-01: Filtro por tipo (NPS, Sugestão, Bug)</li>
            <li style={{ color: '#00ff88' }} className="ml-4">- Tabela notification_preferences criada</li>
            <li style={{ color: '#00ff88' }} className="ml-4">- UI Cyber-neon com toggles interativos</li>
            <li style={{ color: '#00ff88' }}>✅ ST-19: Gerenciar Domínios - Implementado</li>
            <li style={{ color: '#00ff88' }}>✅ UI Cyber-neon - Sharp corners, neon green</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
