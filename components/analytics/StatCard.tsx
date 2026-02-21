'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = '#00ff88',
  trend 
}: StatCardProps) {
  return (
    <div 
      className="p-6 transition-all"
      style={{ 
        backgroundColor: '#0a0a0a', 
        border: '1px solid #222222' 
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = iconColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#222222';
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ 
            color: '#888888', 
            fontSize: '0.875rem', 
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </h3>
          <p 
            className="text-3xl font-bold"
            style={{ color: '#ffffff' }}
          >
            {value}
          </p>
          {subtitle && (
            <p style={{ 
              color: '#666666', 
              fontSize: '0.875rem', 
              marginTop: '0.5rem' 
            }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span 
                style={{ 
                  color: trend.isPositive ? '#00ff88' : '#ff4444',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span style={{ color: '#666666', fontSize: '0.75rem' }}>
                vs período anterior
              </span>
            </div>
          )}
        </div>
        <div 
          className="p-3"
          style={{ 
            backgroundColor: `${iconColor}15`,
            border: `1px solid ${iconColor}40`
          }}
        >
          <Icon size={24} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
