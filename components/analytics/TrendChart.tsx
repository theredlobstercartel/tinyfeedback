'use client';

interface TrendChartProps {
  data: { date: string; count: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="p-6 flex flex-col items-center justify-center"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222',
          minHeight: '200px'
        }}
      >
        <p style={{ color: '#666666', fontSize: '0.875rem' }}>
          Sem dados de tendência
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 150;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'short',
      day: 'numeric'
    });
  };

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
        Tendência (7 dias)
      </h3>

      <div style={{ height: chartHeight, position: 'relative' }}>
        {/* Y-axis grid lines */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${(i / 3) * 100}%`,
              borderTop: '1px solid #222222',
              height: 0,
            }}
          />
        ))}

        {/* Bars */}
        <div className="flex items-end justify-between h-full gap-2" style={{ paddingTop: '10px' }}>
          {data.map((item, index) => {
            const height = maxCount > 0 ? (item.count / maxCount) * (chartHeight - 30) : 0;
            const isToday = index === data.length - 1;
            
            return (
              <div 
                key={item.date}
                className="flex-1 flex flex-col items-center justify-end"
              >
                <div className="relative w-full">
                  <div
                    style={{
                      height: `${height}px`,
                      backgroundColor: isToday ? '#00ff88' : '#00ff8850',
                      border: `1px solid ${isToday ? '#00ff88' : '#00ff8840'}`,
                      transition: 'all 0.3s ease',
                      minHeight: item.count > 0 ? '4px' : '0',
                    }}
                    className="w-full"
                    title={`${item.count} feedbacks`}
                  />
                  {item.count > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: isToday ? '#00ff88' : '#888888',
                        fontSize: '0.75rem',
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
                <span 
                  style={{ 
                    color: isToday ? '#ffffff' : '#666666', 
                    fontSize: '0.75rem',
                    marginTop: '8px',
                    fontWeight: isToday ? 500 : 400,
                  }}
                >
                  {formatDate(item.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
