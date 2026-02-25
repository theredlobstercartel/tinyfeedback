'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Filter, X, Calendar, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeedbackFilters } from '@/types/dashboard-feedback'

interface FeedbackFiltersProps {
  filters: FeedbackFilters
  onFiltersChange: (filters: FeedbackFilters) => void
  className?: string
}

const typeOptions = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'nps', label: 'NPS' },
  { value: 'suggestion', label: 'Sugestão' },
  { value: 'bug', label: 'Bug' },
]

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'new', label: 'Novo' },
  { value: 'analyzing', label: 'Em análise' },
  { value: 'implemented', label: 'Implementado' },
  { value: 'archived', label: 'Arquivado' },
]

const priorityOptions = [
  { value: 'all', label: 'Todas as prioridades' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
]

const categoryOptions = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'Feature', label: 'Feature' },
  { value: 'Bug', label: 'Bug' },
  { value: 'Improvement', label: 'Melhoria' },
  { value: 'Other', label: 'Outro' },
]

const ratingOptions = [
  { value: 'all', label: 'Todas as notas' },
  { value: '10', label: '10 - Excelente' },
  { value: '9', label: '9' },
  { value: '8', label: '8' },
  { value: '7', label: '7' },
  { value: '6', label: '6' },
  { value: '5', label: '5' },
  { value: '4', label: '4' },
  { value: '3', label: '3' },
  { value: '2', label: '2' },
  { value: '1', label: '1' },
  { value: '0', label: '0 - Péssimo' },
]

const sortOptions = [
  { value: 'created_at', label: 'Data de criação' },
  { value: 'updated_at', label: 'Última atualização' },
  { value: 'type', label: 'Tipo' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Prioridade' },
]

export function FeedbackFiltersPanel({
  filters,
  onFiltersChange,
  className,
}: FeedbackFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleChange = useCallback((key: keyof FeedbackFilters, value: string | number | undefined) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }, [localFilters, onFiltersChange])

  const handleSearch = useCallback((value: string) => {
    const newFilters = { ...localFilters, search: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }, [localFilters, onFiltersChange])

  const clearFilters = useCallback(() => {
    const cleared: FeedbackFilters = {
      sortBy: 'created_at',
      sortOrder: 'desc',
    }
    setLocalFilters(cleared)
    onFiltersChange(cleared)
  }, [onFiltersChange])

  const hasActiveFilters =
    (localFilters.type && localFilters.type !== 'all') ||
    (localFilters.status && localFilters.status !== 'all') ||
    (localFilters.priority && localFilters.priority !== 'all') ||
    (localFilters.category && localFilters.category !== 'all') ||
    (localFilters.rating && localFilters.rating !== 'all') ||
    localFilters.dateFrom ||
    localFilters.dateTo ||
    localFilters.search

  const activeFilterCount = [
    localFilters.type && localFilters.type !== 'all',
    localFilters.status && localFilters.status !== 'all',
    localFilters.priority && localFilters.priority !== 'all',
    localFilters.category && localFilters.category !== 'all',
    localFilters.rating && localFilters.rating !== 'all',
    localFilters.dateFrom,
    localFilters.dateTo,
    localFilters.search,
  ].filter(Boolean).length

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Search bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email, nome ou conteúdo..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 text-sm border rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'border-gray-200'
              )}
            />
            {localFilters.search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isExpanded
                ? 'bg-blue-50 text-blue-700'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {localFilters.type && localFilters.type !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Tipo: {typeOptions.find(o => o.value === localFilters.type)?.label}
                <button onClick={() => handleChange('type', 'all')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {localFilters.status && localFilters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Status: {statusOptions.find(o => o.value === localFilters.status)?.label}
                <button onClick={() => handleChange('status', 'all')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {localFilters.priority && localFilters.priority !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Prioridade: {priorityOptions.find(o => o.value === localFilters.priority)?.label}
                <button onClick={() => handleChange('priority', 'all')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {localFilters.category && localFilters.category !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Categoria: {localFilters.category}
                <button onClick={() => handleChange('category', 'all')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {localFilters.rating && localFilters.rating !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Nota: {localFilters.rating}
                <button onClick={() => handleChange('rating', 'all')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
            {(localFilters.dateFrom || localFilters.dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                Período
                <button onClick={() => { handleChange('dateFrom', undefined); handleChange('dateTo', undefined); }} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <select
              value={localFilters.type || 'all'}
              onChange={(e) => handleChange('type', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={localFilters.status || 'all'}
              onChange={(e) => handleChange('status', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridade</label>
            <select
              value={localFilters.priority || 'all'}
              onChange={(e) => handleChange('priority', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
            <select
              value={localFilters.category || 'all'}
              onChange={(e) => handleChange('category', e.target.value === 'all' ? undefined : e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Rating filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <Star className="w-4 h-4" /> Nota NPS
            </label>
            <select
              value={localFilters.rating?.toString() || 'all'}
              onChange={(e) => handleChange('rating', e.target.value === 'all' ? undefined : parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ratingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordenar por</label>
            <div className="flex gap-2">
              <select
                value={localFilters.sortBy || 'created_at'}
                onChange={(e) => handleChange('sortBy', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => handleChange('sortOrder', localFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                title={localFilters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
              >
                {localFilters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Date range */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Período</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => handleChange('dateFrom', e.target.value || undefined)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-gray-500">até</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => handleChange('dateTo', e.target.value || undefined)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
