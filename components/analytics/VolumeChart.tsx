'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  date: string;
  count: number;
  displayDate: string;
}

interface VolumeChartProps {
  data: { date: string; count: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
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
          Sem dados de volume
        </p>
      </div>
    );
  }

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

  const chartData = data.map(item => ({
    ...item,
    displayDate: formatDate(item.date),
  }));

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
        Volume de Feedbacks (30 dias)
      </h3>

      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              allowDecimals={false}
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
              formatter={(value) => [`${value} feedbacks`, '']}
              labelFormatter={(_label, payload) => {
                if (payload && payload[0] && payload[0].payload) {
                  const p = payload[0].payload as ChartDataItem;
                  return formatFullDate(p.date);
                }
                return String(_label);
              }}
              cursor={{ fill: 'rgba(0, 255, 136, 0.05)' }}
            />
            <Bar 
              dataKey="count" 
              fill="#00ff88"
              stroke="#00ff88"
              strokeWidth={1}
              radius={0}
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div 
        className="mt-4 pt-4 flex justify-between items-center"
        style={{ borderTop: '1px solid #222222' }}
      >
        <div>
          <p style={{ color: '#666666', fontSize: '0.75rem' }}>
            Total no período
          </p>
          <p style={{ color: '#00ff88', fontSize: '1.25rem', fontWeight: 600 }}>
            {data.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
        <div className="text-right">
          <p style={{ color: '#666666', fontSize: '0.75rem' }}>
            Média diária
          </p>
          <p style={{ color: '#00d4ff', fontSize: '1.25rem', fontWeight: 600 }}>
            {(data.reduce((sum, item) => sum + item.count, 0) / data.length).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
