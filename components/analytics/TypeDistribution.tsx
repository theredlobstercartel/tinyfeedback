'use client';

import { MessageSquare, Lightbulb, Bug } from 'lucide-react';

interface TypeDistributionProps {
  distribution: {
    nps: number;
    suggestion: number;
    bug: number;
  };
}

export function TypeDistribution({ distribution }: TypeDistributionProps) {
  const total = distribution.nps + distribution.suggestion + distribution.bug;
  
  const getPercentage = (value: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const data = [
    { 
      type: 'NPS', 
      count: distribution.nps, 
      percentage: getPercentage(distribution.nps),
      icon: MessageSquare,
      color: '#00ff88',
      bgColor: 'rgba(0, 255, 136, 0.05)'
    },
    { 
      type: 'Sugestão', 
      count: distribution.suggestion, 
      percentage: getPercentage(distribution.suggestion),
      icon: Lightbulb,
      color: '#00d4ff',
      bgColor: 'rgba(0, 212, 255, 0.05)'
    },
    { 
      type: 'Bug', 
      count: distribution.bug, 
      percentage: getPercentage(distribution.bug),
      icon: Bug,
      color: '#ff4444',
      bgColor: 'rgba(255, 68, 68, 0.05)'
    },
  ];

  return (
    <div 
      className="p-6"
      style={{ 
        backgroundColor: '#0a0a0a', 
        border: '1px solid #222222' 
      }}
    >
      <h3 style={{ 
        color: '#ffffff', 
        fontSize: '1.125rem', 
        fontWeight: 600, 
        marginBottom: '1.5rem'
      }}
      >
        Distribuição por Tipo
      </h3>

      {total === 0 ? (
        <p style={{ color: '#666666', textAlign: 'center', padding: '2rem 0' }}>
          Nenhum feedback recebido ainda
        </p>
      ) : (
        <>
          {/* Bar Chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div 
              style={{ 
                display: 'flex', 
                height: '32px', 
                borderRadius: '0',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a'
              }}
            >
              {data.map((item) => (
                item.percentage > 0 && (
                  <div
                    key={item.type}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                      transition: 'width 0.5s ease',
                    }}
                    title={`${item.type}: ${item.count} (${item.percentage}%)`}
                  />
                )
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((item) => (
              <div 
                key={item.type}
                className="p-4 text-center"
                style={{ 
                  backgroundColor: item.bgColor,
                  border: `1px solid ${item.color}` 
                }}
              >
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <item.icon size={16} style={{ color: item.color }} />
                  <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                    {item.type}
                  </p>
                </div>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: item.color }}
                >
                  {item.count}
                </p>
                <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {item.percentage}%
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div 
            style={{ 
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #222222',
              textAlign: 'center'
            }}
          >
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Total de feedbacks: <span style={{ color: '#ffffff', fontWeight: 600 }}>{total}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
