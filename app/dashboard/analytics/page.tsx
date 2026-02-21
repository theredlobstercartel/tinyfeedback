'use client';

import { BarChart3, TrendingUp, Users, MessageSquare } from 'lucide-react';

export default function AnalyticsPage() {
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
          Analytics
        </h1>
        <p style={{ color: '#888888' }}>
          Acompanhe as métricas e estatísticas dos seus projetos.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Feedbacks', value: '0', icon: MessageSquare, color: '#00ff88' },
          { label: 'Média NPS', value: '-', icon: TrendingUp, color: '#00d4ff' },
          { label: 'Usuários Únicos', value: '0', icon: Users, color: '#ff8800' },
          { label: 'Taxa de Resposta', value: '0%', icon: BarChart3, color: '#ff00ff' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <p 
              className="text-3xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder for Charts */}
      <div
        className="p-8"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222' 
        }}
      >
        <div className="text-center py-12">
          <BarChart3 
            size={48} 
            className="mx-auto mb-4"
            style={{ color: '#444444' }}
          />
          <h3 
            className="text-lg font-medium mb-2"
            style={{ color: '#ffffff' }}
          >
            Gráficos em breve
          </h3>
          <p style={{ color: '#666666' }}>
            Os gráficos de analytics serão implementados na story ST-21.
          </p>
        </div>
      </div>
    </div>
  );
}
