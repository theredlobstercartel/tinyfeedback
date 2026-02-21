'use client';

import { useState } from 'react';
import { Filter, X, Calendar, Star } from 'lucide-react';

export interface FeedbackFilters {
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  npsMin: string;
  npsMax: string;
  sort: 'newest' | 'oldest';
}

interface FeedbackFiltersProps {
  filters: FeedbackFilters;
  onChange: (filters: FeedbackFilters) => void;
  onClear: () => void;
}

const defaultFilters: FeedbackFilters = {
  type: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  npsMin: '',
  npsMax: '',
  sort: 'newest',
};

const typeOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'nps', label: 'NPS' },
  { value: 'suggestion', label: 'Sugestão' },
  { value: 'bug', label: 'Bug' },
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'new', label: 'Novo' },
  { value: 'read', label: 'Lido' },
  { value: 'responded', label: 'Respondido' },
  { value: 'archived', label: 'Arquivado' },
];

export function FeedbackFilterPanel({ filters, onChange, onClear }: FeedbackFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = 
    filters.type || 
    filters.status || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.npsMin || 
    filters.npsMax;

  const handleChange = (key: keyof FeedbackFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onClear();
    setIsExpanded(false);
  };

  return (
    <div
      style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #222222',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2"
            style={{ color: '#00ff88' }}
          >
            <Filter size={20} />
            <span className="font-medium">Filtros</span>
          </div>
          
          {hasActiveFilters && (
            <span
              className="px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.15)',
                color: '#00ff88',
                border: '1px solid #00ff88',
              }}
            >
              Ativos
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <select
            value={filters.sort}
            onChange={(e) => handleChange('sort', e.target.value)}
            className="px-3 py-2 text-sm outline-none cursor-pointer"
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '1px solid #333333',
            }}
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#ff4444',
                border: '1px solid #ff4444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={14} />
              Limpar
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isExpanded ? '#00ff88' : 'transparent',
              color: isExpanded ? '#000000' : '#00ff88',
              border: '1px solid #00ff88',
            }}
            onMouseEnter={(e) => {
              if (!isExpanded) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExpanded) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isExpanded ? 'Ocultar' : 'Avançado'}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div
          className="p-4 pt-0"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#888888' }}>
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: '1px solid #333333',
                }}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#888888' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: '1px solid #333333',
                }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#888888' }}>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Data inicial
                </span>
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: '1px solid #333333',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#888888' }}>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Data final
                </span>
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: '1px solid #333333',
                }}
              />
            </div>
          </div>

          {/* NPS Score Filter - Only show when type is nps or all */}
          {(filters.type === '' || filters.type === 'nps') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#888888' }}>
                  <span className="flex items-center gap-1.5">
                    <Star size={14} style={{ color: '#00d4ff' }} />
                    NPS mínimo
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.npsMin}
                  onChange={(e) => handleChange('npsMin', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '1px solid #333333',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#888888' }}>
                  <span className="flex items-center gap-1.5">
                    <Star size={14} style={{ color: '#00d4ff' }} />
                    NPS máximo
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={filters.npsMax}
                  onChange={(e) => handleChange('npsMax', e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '1px solid #333333',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { defaultFilters };