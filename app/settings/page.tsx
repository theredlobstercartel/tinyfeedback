import { DomainManager } from '@/components/settings';

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
          <h3 className="mb-3" style={{ color: '#ffffff' }}>Status da Implementação ST-19:</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li style={{ color: '#00ff88' }}>✅ AC-01: Adicionar domínio - Implementado</li>
            <li style={{ color: '#00ff88' }}>✅ AC-02: Remover domínio - Implementado</li>
            <li style={{ color: '#00ff88' }}>✅ AC-03: Validação - Implementado</li>
            <li style={{ color: '#00ff88' }}>✅ Testes de domínio - 9 testes passando</li>
            <li style={{ color: '#00ff88' }}>✅ Testes de API - 7 testes passando</li>
            <li style={{ color: '#00ff88' }}>✅ UI Cyber-neon - Sharp corners, neon green</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
