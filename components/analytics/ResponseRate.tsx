'use client';

import { MessageCircle, CheckCircle2 } from 'lucide-react';

interface ResponseRateProps {
  responseRate: {
    total: number;
    responded: number;
    rate: number;
  };
}

export function ResponseRate({ responseRate }: ResponseRateProps) {
  const { total, responded, rate } = responseRate;

  // Determine color based on response rate
  let color = '#ff4444'; // Red for low
  let label = 'Precisa melhorar';

  if (rate >= 80) {
    color = '#00ff88';
    label = 'Excelente';
  } else if (rate >= 50) {
    color = '#ffd700';
    label = 'Bom';
  } else if (rate >= 25) {
    color = '#ffaa00';
    label = 'Regular';
  }

  // Calculate circle progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div
      className="p-6"
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #222222'
      }}
    >
      <h3 style={{
        color: '#888888',
        fontSize: '0.875rem',
        marginBottom: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Taxa de Resposta
      </h3>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '150px' }}>
          <MessageCircle size={32} style={{ color: '#333333', marginBottom: '0.75rem' }} />
          <p style={{ color: '#666666', fontSize: '0.875rem' }}>
            Sem feedbacks ainda
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative" style={{ width: '100px', height: '100px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#222222"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)"
                style={{
                  filter: `drop-shadow(0 0 4px ${color})`,
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color }}>
                {rate}%
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="text-lg font-semibold mb-1" style={{ color }}>
              {label}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: '#00ff88' }} />
                <span style={{ color: '#888888', fontSize: '0.875rem' }}>
                  {responded} respondidos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={14} style={{ color: '#666666' }} />
                <span style={{ color: '#888888', fontSize: '0.875rem' }}>
                  {total} total
                </span>
              </div>
            </div>
            <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.75rem' }}>
              Feedbacks com resposta enviada
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
