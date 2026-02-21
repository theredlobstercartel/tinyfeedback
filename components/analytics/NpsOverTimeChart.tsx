'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface NpsOverTimeData {
  date: string;
  avgNps: number;
  count: number;
}

interface NpsOverTimeChartProps {
  data: NpsOverTimeData[];
  period: string;
  onPeriodChange: (period: string) => void;
  isLoading?: boolean;
}

const periods = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

// Tooltip types
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: NpsOverTimeData;
  }>;
  label?: string;
}

export function NpsOverTimeChart({
  data,
  period,
  onPeriodChange,
  isLoading = false,
}: NpsOverTimeChartProps) {
  const [hoveredData, setHoveredData] = useState<NpsOverTimeData | null>(null);

  // Calculate average NPS for the period
  const validNps = data.filter((d) => d.avgNps > 0).map((d) => d.avgNps);
  const averageNps =
    validNps.length > 0
      ? Math.round((validNps.reduce((a, b) => a + b, 0) / validNps.length) * 10) / 10
      : null;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #333333',
            padding: '12px',
            borderRadius: '0px',
          }}
        >
          <p style={{ color: '#ffffff', marginBottom: '4px', fontWeight: 600 }}>
            {formatDate(item.date)}
          </p>
          <p style={{ color: '#00ff88', marginBottom: '2px' }}>
            NPS: {item.avgNps > 0 ? item.avgNps.toFixed(1) : 'N/A'}
          </p>
          <p style={{ color: '#888888', fontSize: '0.75rem' }}>
            {item.count} resposta{item.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #222222',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h3
            style={{
              color: '#ffffff',
              fontSize: '1.125rem',
              fontWeight: 600,
              marginBottom: '4px',
            }}
          >
            NPS ao Longo do Tempo
          </h3>
          <p style={{ color: '#888888', fontSize: '0.875rem' }}>
            Evolução da pontuação NPS por dia
          </p>
        </div>

        {/* Period Filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: period === p.value ? '#00ff88' : 'transparent',
                color: period === p.value ? '#000000' : '#888888',
                border: `1px solid ${period === p.value ? '#00ff88' : '#444444'}`,
                fontSize: '0.875rem',
                fontWeight: period === p.value ? 600 : 400,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (period !== p.value && !isLoading) {
                  e.currentTarget.style.borderColor = '#00ff88';
                  e.currentTarget.style.color = '#00ff88';
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (period !== p.value && !isLoading) {
                  e.currentTarget.style.borderColor = '#444444';
                  e.currentTarget.style.color = '#888888';
                }
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Average Display */}
      {averageNps !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: '#000000',
            border: '1px solid #222222',
          }}
        >
          <div>
            <p style={{ color: '#888888', fontSize: '0.75rem', marginBottom: '2px' }}>
              Média do Período
            </p>
            <p
              style={{
                color: averageNps >= 9 ? '#00ff88' : averageNps >= 7 ? '#ffd700' : '#ff4444',
                fontSize: '1.5rem',
                fontWeight: 700,
              }}
            >
              {averageNps.toFixed(1)}
            </p>
          </div>
          <div
            style={{
              width: '1px',
              height: '32px',
              backgroundColor: '#333333',
            }}
          />
          <div>
            <p style={{ color: '#888888', fontSize: '0.75rem', marginBottom: '2px' }}>
              Total de Respostas
            </p>
            <p style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
              {data.reduce((sum, d) => sum + d.count, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: '100%', height: '300px' }}>
        {isLoading ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '2px solid #222222',
                borderTop: '2px solid #00ff88',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
        ) : data.length === 0 || data.every((d) => d.avgNps === 0) ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666666',
            }}
          >
            <p>Sem dados de NPS para este período</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              As respostas NPS aparecerão aqui
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onMouseMove={(e: unknown) => {
                const event = e as { activePayload?: Array<{ payload: NpsOverTimeData }> };
                if (event.activePayload) {
                  setHoveredData(event.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#222222"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666666"
                tick={{ fill: '#666666', fontSize: 12 }}
                axisLine={{ stroke: '#333333' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#666666"
                tick={{ fill: '#666666', fontSize: 12 }}
                axisLine={{ stroke: '#333333' }}
                tickLine={false}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Reference lines for NPS zones */}
              <ReferenceLine
                y={9}
                stroke="#00ff88"
                strokeDasharray="5 5"
                strokeOpacity={0.3}
              />
              <ReferenceLine
                y={7}
                stroke="#ffd700"
                strokeDasharray="5 5"
                strokeOpacity={0.3}
              />
              <ReferenceLine
                y={6}
                stroke="#ff4444"
                strokeDasharray="5 5"
                strokeOpacity={0.3}
              />

              <Line
                type="monotone"
                dataKey="avgNps"
                stroke="#00ff88"
                strokeWidth={2}
                dot={{
                  fill: '#00ff88',
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{
                  fill: '#00ff88',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #222222',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#00ff88',
            }}
          />
          <span style={{ color: '#888888', fontSize: '0.75rem' }}>Promotores (9-10)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#ffd700',
            }}
          />
          <span style={{ color: '#888888', fontSize: '0.75rem' }}>Neutros (7-8)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#ff4444',
            }}
          />
          <span style={{ color: '#888888', fontSize: '0.75rem' }}>Detratores (0-6)</span>
        </div>
      </div>
    </div>
  );
}
