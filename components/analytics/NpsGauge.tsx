'use client';

interface NpsGaugeProps {
  score: number | null;
}

export function NpsGauge({ score }: NpsGaugeProps) {
  // Calculate NPS score (-100 to 100)
  // score is 0-10 average, convert to NPS formula
  // Not shown: we need distribution for real NPS
  // This is a simplified visual representation
  
  if (score === null) {
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
          Sem dados de NPS
        </p>
      </div>
    );
  }

  // Determine color based on score
  let color = '#ff4444'; // Red for low
  let label = 'Crítico';
  
  if (score >= 9) {
    color = '#00ff88';
    label = 'Excelente';
  } else if (score >= 7) {
    color = '#ffd700';
    label = 'Bom';
  } else if (score >= 5) {
    color = '#ffaa00';
    label = 'Regular';
  }

  // Calculate percentage for gauge (0-10 scale to 0-100%)
  const percentage = (score / 10) * 100;

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
        Média NPS
      </h3>
      
      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative" style={{ width: '120px', height: '120px' }}>
          {/* Background circle */}
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#222222"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="butt"
              strokeDasharray={`${percentage * 3.39} 339.292`}
              transform="rotate(-90 60 60)"
              style={{
                filter: `drop-shadow(0 0 4px ${color})`,
                transition: 'stroke-dasharray 0.5s ease'
              }}
            />
          </svg>
          {/* Center text */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <span 
              className="text-3xl font-bold"
              style={{ color }}
            >
              {score.toFixed(1)}
            </span>
            <span style={{ color: '#666666', fontSize: '0.75rem' }}>/10</span>
          </div>
        </div>

        {/* Info */}
        <div>
          <div 
            className="text-lg font-semibold mb-1"
            style={{ color }}
          >
            {label}
          </div>
          <p style={{ color: '#666666', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Baseado na média das<br />respostas NPS recebidas
          </p>
        </div>
      </div>
    </div>
  );
}
