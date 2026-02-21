'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface NpsOverTimeDataPoint {
  date: string;
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

interface NpsOverTimeChartProps {
  data: NpsOverTimeDataPoint[];
  period: number;
  onPeriodChange: (days: number) => void;
  isLoading?: boolean;
}

export function NpsOverTimeChart({ data, period, onPeriodChange, isLoading }: NpsOverTimeChartProps) {
  if (isLoading) {
    return (
      <div 
        className="p-6 flex flex-col items-center justify-center"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222',
          minHeight: '300px'
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: '#00ff88' }} />
        <p style={{ color: '#666666', fontSize: '0.875rem', marginTop: '1rem' }}>
          Carregando dados de NPS...
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="p-6 flex flex-col items-center justify-center"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222',
          minHeight: '300px'
        }}
      >
        <p style={{ color: '#666666', fontSize: '0.875rem' }}>
          Sem dados de NPS
        </p>
      </div>
    );
  }

  // Filter data based on selected period
  const filteredData = data.slice(-period);

  // Format date for display (DD/MM)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Format full date for tooltip
  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const chartData = filteredData.map(item => ({
    ...item,
    displayDate: formatDate(item.date),
    npsDisplay: item.npsScore !== null ? item.npsScore : null,
  }));

  // Calculate average NPS for the period
  const validNpsScores = filteredData
    .filter(item => item.npsScore !== null)
    .map(item => item.npsScore as number);
  
  const averageNps = validNpsScores.length > 0
    ? Math.round((validNpsScores.reduce((a, b) => a + b, 0) / validNpsScores.length) * 10) / 10
    : null;

  // Calculate total responses
  const totalResponses = filteredData.reduce((sum, item) => sum + item.totalResponses, 0);

  return (
    <div 
      className="p-6"
      style={{ 
        backgroundColor: '#0a0a0a', 
        border: '1px solid #222222' 
      }}
    >
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 style={{ 
          color: '#888888', 
          fontSize: '0.875rem', 
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Evolução do NPS
        </h3>

        {/* Period Filter */}
        <div 
          className="flex"
          style={{ 
            border: '1px solid #333333',
            backgroundColor: '#000000'
          }}
        >
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => onPeriodChange(days)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: period === days ? '#00ff88' : 'transparent',
                color: period === days ? '#000000' : '#888888',
                border: 'none',
                borderRight: days !== 90 ? '1px solid #333333' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (period !== days) {
                  e.currentTarget.style.color = '#00ff88';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (period !== days) {
                  e.currentTarget.style.color = '#888888';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#222222" 
              vertical={false}
            />
            <XAxis 
              dataKey="displayDate"
              stroke="#444444"
              tick={{ fill: '#666666', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#333333' }}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis 
              stroke="#444444"
              tick={{ fill: '#666666', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#333333' }}
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #333333',
                borderRadius: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              }}
              labelStyle={{
                color: '#00ff88',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
              itemStyle={{
                color: '#ffffff',
                fontSize: '0.875rem',
              }}
              formatter={(value) => {
                const numValue = value as number | null | undefined;
                return numValue !== null && numValue !== undefined
                  ? [`NPS: ${numValue.toFixed(1)}`, '']
                  : ['Sem dados', ''];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return formatFullDate(payload[0].payload.date);
                }
                return label;
              }}
              cursor={{ stroke: '#00ff88', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Line 
              type="monotone"
              dataKey="npsDisplay" 
              stroke="#00d4ff"
              strokeWidth={2}
              dot={{ fill: '#00d4ff', strokeWidth: 0, r: 3 }}
              activeDot={{ fill: '#00ff88', strokeWidth: 0, r: 5 }}
              animationDuration={1000}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div 
        className="mt-4 pt-4 flex justify-between items-center"
        style={{ borderTop: '1px solid #222222' }}
      >
        <div>
          <p style={{ color: '#666666', fontSize: '0.75rem' }}>
            Média NPS ({period}d)
          </p>
          <p style={{ 
            color: averageNps !== null 
              ? averageNps >= 8 ? '#00ff88' : averageNps >= 6 ? '#ffd700' : '#ff4444'
              : '#666666', 
            fontSize: '1.25rem', 
            fontWeight: 600 
          }}>
            {averageNps !== null ? averageNps.toFixed(1) : '-'}
          </p>
        </div>
        <div className="text-right">
          <p style={{ color: '#666666', fontSize: '0.75rem' }}>
            Total de respostas
          </p>
          <p style={{ color: '#00d4ff', fontSize: '1.25rem', fontWeight: 600 }}>
            {totalResponses}
          </p>
        </div>
      </div>
    </div>
  );
}
