'use client';

import { Settings, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="p-6"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222' 
        }}
      >
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ color: '#ffffff' }}
        >
          Configurações
        </h1>
        <p style={{ color: '#888888' }}>
          Gerencie as configurações da sua conta e projetos.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div
          className="p-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="p-2"
              style={{ 
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                color: '#00ff88'
              }}
            >
              <Settings size={20} />
            </div>
            <h2 
              className="text-lg font-semibold"
              style={{ color: '#ffffff' }}
            >
              Perfil
            </h2>
          </div>
          
          <p style={{ color: '#666666' }}>
            Configurações de perfil serão implementadas em breve.
          </p>
        </div>

        {/* Notifications */}
        <div
          className="p-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="p-2"
              style={{ 
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                color: '#00d4ff'
              }}
            >
              <Bell size={20} />
            </div>
            <h2 
              className="text-lg font-semibold"
              style={{ color: '#ffffff' }}
            >
              Notificações
            </h2>
          </div>
          
          <p style={{ color: '#666666' }}>
            Configurações de notificações serão implementadas na story ST-25.
          </p>
        </div>

        {/* Security */}
        <div
          className="p-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="p-2"
              style={{ 
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                color: '#ff4444'
              }}
            >
              <Shield size={20} />
            </div>
            <h2 
              className="text-lg font-semibold"
              style={{ color: '#ffffff' }}
            >
              Segurança
            </h2>
          </div>
          
          <p style={{ color: '#666666' }}>
            Configurações de segurança serão implementadas em breve.
          </p>
        </div>

        {/* Appearance */}
        <div
          className="p-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="p-2"
              style={{ 
                backgroundColor: 'rgba(255, 136, 0, 0.1)',
                color: '#ff8800'
              }}
            >
              <Palette size={20} />
            </div>
            <h2 
              className="text-lg font-semibold"
              style={{ color: '#ffffff' }}
            >
              Aparência
            </h2>
          </div>
          
          <p style={{ color: '#666666' }}>
            Configurações de aparência serão implementadas na story ST-18.
          </p>
        </div>
      </div>
    </div>
  );
}
