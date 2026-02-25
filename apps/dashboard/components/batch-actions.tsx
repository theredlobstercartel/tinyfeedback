'use client'

import { Archive, Trash2, CheckCircle, X, MailOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BatchActionsProps {
  selectedCount: number
  onArchive: () => void
  onDelete: () => void
  onMarkAsRead?: () => void
  onMarkAsAnalyzing?: () => void
  onClear: () => void
}

export function BatchActions({
  selectedCount,
  onArchive,
  onDelete,
  onMarkAsRead,
  onMarkAsAnalyzing,
  onClear,
}: BatchActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}</span>
        <button
          onClick={onClear}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Limpar seleção"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-200"></div>

      <div className="flex items-center gap-2">
        {onMarkAsRead && (
          <button
            onClick={onMarkAsRead}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
            )}
          >
            <MailOpen className="w-4 h-4" />
            Marcar como lido
          </button>
        )}

        {onMarkAsAnalyzing && (
          <button
            onClick={onMarkAsAnalyzing}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              'text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
            )}
          >
            <CheckCircle className="w-4 h-4" />
            Em análise
          </button>
        )}

        <button
          onClick={onArchive}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            'text-gray-700 bg-gray-100 hover:bg-gray-200'
          )}
        >
          <Archive className="w-4 h-4" />
          Arquivar
        </button>

        <button
          onClick={onDelete}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            'text-red-700 bg-red-50 hover:bg-red-100'
          )}
        >
          <Trash2 className="w-4 h-4" />
          Deletar
        </button>
      </div>
    </div>
  )
}
