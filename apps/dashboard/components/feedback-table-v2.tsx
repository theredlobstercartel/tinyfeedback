'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table'
import {
  MessageSquare,
  ThumbsUp,
  Bug,
  MoreHorizontal,
  Eye,
  Archive,
  Trash2,
  Mail,
  User,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Monitor,
  RotateCcw,
  MailOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FeedbackItem, FeedbackStatus } from '@/types/dashboard-feedback'

// Types
interface FeedbackTableProps {
  feedbacks: FeedbackItem[]
  isLoading?: boolean
  totalItems: number
  page: number
  pageSize: number
  sorting: SortingState
  columnFilters: ColumnFiltersState
  rowSelection: RowSelectionState
  onSortingChange: (sorting: SortingState) => void
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
  onRowSelectionChange: (selection: RowSelectionState) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onView: (feedback: FeedbackItem) => void
  onStatusChange: (id: string, status: FeedbackStatus) => void
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  onRestore?: (id: string) => void
  onDelete: (id: string) => void
  archivingIds?: Set<string>
}

// Configurations
const typeConfig = {
  nps: { icon: ThumbsUp, label: 'NPS', color: 'bg-purple-100 text-purple-700' },
  suggestion: { icon: MessageSquare, label: 'Sugestão', color: 'bg-blue-100 text-blue-700' },
  bug: { icon: Bug, label: 'Bug', color: 'bg-red-100 text-red-700' },
}

const statusConfig: Record<FeedbackStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  new: { label: 'Novo', variant: 'default', color: 'bg-blue-100 text-blue-700' },
  read: { label: 'Lido', variant: 'secondary', color: 'bg-indigo-100 text-indigo-700' },
  analyzing: { label: 'Em análise', variant: 'warning', color: 'bg-yellow-100 text-yellow-700' },
  implemented: { label: 'Implementado', variant: 'success', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Arquivado', variant: 'secondary', color: 'bg-gray-100 text-gray-700' },
}

const priorityConfig = {
  high: { label: 'Alta', color: 'text-red-600 bg-red-50' },
  medium: { label: 'Média', color: 'text-yellow-600 bg-yellow-50' },
  low: { label: 'Baixa', color: 'text-gray-500 bg-gray-50' },
}

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getFeedbackSummary(feedback: FeedbackItem): string {
  if (feedback.type === 'nps') {
    return `Nota: ${feedback.content.score}/10`
  }
  if (feedback.content.title) {
    return feedback.content.title
  }
  if (feedback.content.description) {
    return feedback.content.description.slice(0, 100) + (feedback.content.description.length > 100 ? '...' : '')
  }
  return '-'
}

function getFeedbackContent(feedback: FeedbackItem): string {
  if (feedback.content.comment) {
    return feedback.content.comment
  }
  if (feedback.content.description) {
    return feedback.content.description
  }
  return ''
}

const columnHelper = createColumnHelper<FeedbackItem>()

// Screenshot Preview Component
function ScreenshotPreview({ feedback, onView }: { feedback: FeedbackItem; onView: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const hasScreenshot = feedback.technical_context?.viewport !== undefined

  if (!hasScreenshot) return null

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onView}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
      >
        <ImageIcon className="w-3 h-3" />
        Screenshot
      </button>
      
      {/* Inline Preview Popup */}
      {isHovered && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gray-100 rounded border border-gray-200 aspect-video flex items-center justify-center">
            <div className="text-center p-4">
              <Monitor className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-2">{feedback.technical_context?.viewport?.width} x {feedback.technical_context?.viewport?.height}</p>
              <button
                onClick={onView}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Ver detalhes
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 truncate">
            {feedback.technical_context?.url}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45"></div>
        </div>
      )}
    </div>
  )
}

export function FeedbackTableV2({
  feedbacks,
  isLoading,
  totalItems,
  page,
  pageSize,
  sorting,
  columnFilters,
  rowSelection,
  onSortingChange,
  onColumnFiltersChange,
  onRowSelectionChange,
  onPageChange,
  onPageSizeChange,
  onView,
  onStatusChange,
  onMarkAsRead,
  onArchive,
  onRestore,
  onDelete,
  archivingIds = new Set(),
}: FeedbackTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const columns = useMemo(() => [
    // Selection column
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) {
              el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
            }
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      size: 40,
    }),

    // Type column
    columnHelper.accessor('type', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        >
          Tipo
          {column.getIsSorted() === 'asc' ? <ArrowUp className="w-3 h-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="w-3 h-3" /> :
           <ArrowUpDown className="w-3 h-3" />}
        </button>
      ),
      cell: ({ row }) => {
        const type = row.original.type
        const TypeIcon = typeConfig[type].icon
        const isNew = row.original.status === 'new'
        return (
          <div className="flex items-center gap-2">
            <span className={cn('p-1.5 rounded-lg', typeConfig[type].color)}>
              <TypeIcon className="w-4 h-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {typeConfig[type].label}
              </span>
              {row.original.priority && row.original.type === 'bug' && (
                <span className={cn('text-xs mt-0.5 px-2 py-0.5 rounded w-fit', priorityConfig[row.original.priority].color)}>
                  {priorityConfig[row.original.priority].label}
                </span>
              )}
            </div>
            {isNew && (
              <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Novo" />
            )}
          </div>
        )
      },
      size: 120,
    }),

    // Content column
    columnHelper.accessor('content', {
      header: 'Conteúdo',
      cell: ({ row }) => {
        const feedback = row.original
        const content = getFeedbackContent(feedback)
        const isNew = feedback.status === 'new'
        return (
          <div className={cn('max-w-xs', isNew && 'font-medium')}>
            <p className="text-sm text-gray-900 truncate">
              {getFeedbackSummary(feedback)}
            </p>
            {content && (
              <p className={cn('text-sm line-clamp-2 mt-0.5', isNew ? 'text-gray-700' : 'text-gray-500')}>
                {content}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <ScreenshotPreview 
                feedback={feedback} 
                onView={() => onView(feedback)} 
              />
              {feedback.content.category && (
                <Badge variant="outline" className="text-xs">{feedback.content.category}</Badge>
              )}
            </div>
          </div>
        )
      },
      size: 300,
    }),

    // User column
    columnHelper.accessor('user_email', {
      header: 'Usuário',
      cell: ({ row }) => {
        const feedback = row.original
        return (
          <div className="flex items-center gap-2">
            {feedback.user_email ? (
              <>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{feedback.user_name || feedback.user_email}</p>
                  {feedback.user_name && (
                    <p className="text-xs text-gray-500 truncate">{feedback.user_email}</p>
                  )}
                </div>
              </>
            ) : feedback.anonymous_id ? (
              <>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-sm text-gray-500">Anônimo</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-sm text-gray-500">Desconhecido</span>
              </>
            )}
          </div>
        )
      },
      size: 200,
    }),

    // Status column
    columnHelper.accessor('status', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        >
          Status
          {column.getIsSorted() === 'asc' ? <ArrowUp className="w-3 h-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="w-3 h-3" /> :
           <ArrowUpDown className="w-3 h-3" />}
        </button>
      ),
      cell: ({ row }) => (
        <Badge variant={statusConfig[row.original.status].variant}>
          {statusConfig[row.original.status].label}
        </Badge>
      ),
      size: 120,
    }),

    // Date column
    columnHelper.accessor('created_at', {
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting()}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
        >
          Data
          {column.getIsSorted() === 'asc' ? <ArrowUp className="w-3 h-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="w-3 h-3" /> :
           <ArrowUpDown className="w-3 h-3" />}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(row.original.created_at)}</span>
      ),
      size: 150,
    }),

    // Actions column
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const feedback = row.original
        const isMenuOpen = openMenuId === feedback.id
        const isArchiving = archivingIds.has(feedback.id)
        const isArchived = feedback.status === 'archived'

        return (
          <div className="relative">
            <button
              onClick={() => setOpenMenuId(isMenuOpen ? null : feedback.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenMenuId(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      onView(feedback)
                      setOpenMenuId(null)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalhes
                  </button>
                  
                  {!isArchived && feedback.status === 'new' && (
                    <button
                      onClick={() => {
                        onMarkAsRead(feedback.id)
                        setOpenMenuId(null)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <MailOpen className="w-4 h-4" />
                      Marcar como lido
                    </button>
                  )}
                  
                  {!isArchived && feedback.status !== 'read' && (
                    <button
                      onClick={() => {
                        onStatusChange(feedback.id, 'read')
                        setOpenMenuId(null)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Marcar como lido
                    </button>
                  )}
                  
                  {!isArchived && feedback.status !== 'analyzing' && (
                    <button
                      onClick={() => {
                        onStatusChange(feedback.id, 'analyzing')
                        setOpenMenuId(null)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Em análise
                    </button>
                  )}
                  
                  {!isArchived && feedback.status !== 'implemented' && (
                    <button
                      onClick={() => {
                        onStatusChange(feedback.id, 'implemented')
                        setOpenMenuId(null)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Implementado
                    </button>
                  )}
                  
                  {!isArchived ? (
                    <button
                      onClick={() => {
                        onArchive(feedback.id)
                        setOpenMenuId(null)
                      }}
                      disabled={isArchiving}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Archive className={cn('w-4 h-4', isArchiving && 'animate-spin')} />
                      {isArchiving ? 'Arquivando...' : 'Arquivar'}
                    </button>
                  ) : onRestore ? (
                    <button
                      onClick={() => {
                        onRestore(feedback.id)
                        setOpenMenuId(null)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar
                    </button>
                  ) : null}
                  
                  <hr className="my-1 border-gray-200" />
                  
                  <button
                    onClick={() => {
                      onDelete(feedback.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar
                  </button>
                </div>
              </>
            )}
          </div>
        )
      },
      size: 80,
    }),
  ], [onView, onStatusChange, onMarkAsRead, onArchive, onRestore, onDelete, openMenuId, archivingIds])

  const table = useReactTable({
    data: feedbacks,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    enableRowSelection: true,
    onSortingChange,
    onColumnFiltersChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil(totalItems / pageSize),
  })

  const selectedRows = table.getSelectedRowModel().rows
  const selectedIds = selectedRows.map(row => row.original.id)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (feedbacks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum feedback encontrado</h3>
          <p className="text-gray-500">Ajuste os filtros ou aguarde novos feedbacks.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => {
              const isArchiving = archivingIds.has(row.original.id)
              const isArchived = row.original.status === 'archived'
              
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-gray-50 transition-all duration-200',
                    row.getIsSelected() && 'bg-blue-50/50',
                    isArchiving && 'opacity-50 scale-[0.98]',
                    isArchived && 'bg-gray-50/50',
                    row.original.status === 'new' && 'bg-blue-50/30'
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
