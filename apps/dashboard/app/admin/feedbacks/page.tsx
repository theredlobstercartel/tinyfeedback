'use client'

import { useState, useCallback, useMemo } from 'react'
import { SortingState, ColumnFiltersState, RowSelectionState } from '@tanstack/react-table'
import { DashboardLayout } from '@/components/dashboard-layout'
import { FeedbackFiltersPanel } from '@/components/feedback-filters'
import { FeedbackTableV2 } from '@/components/feedback-table-v2'
import { FeedbackDetailModal } from '@/components/feedback-detail-modal'
import { StatsCards } from '@/components/stats-cards'
import { Pagination } from '@/components/ui/pagination'
import { BatchActions } from '@/components/batch-actions'
import { BatchConfirmDialog } from '@/components/batch-confirm-dialog'
import { FeedbackItem, FeedbackFilters, FeedbackStatus } from '@/types/dashboard-feedback'
import {
  useFeedbacks,
  useFeedbackStats,
  useRealtimeFeedbacks,
  useUpdateFeedbackStatus,
  useDeleteFeedback,
  useBatchUpdateStatus,
  useBatchDelete,
  useFeedbackKeyboardShortcuts,
} from '@/hooks/use-feedbacks'
import { toast } from 'sonner'

const PROJECT_ID = 'demo-project' // In production, get from context/auth
const PAGE_SIZE = 20

export default function FeedbacksPage() {
  // Table state
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [viewingFeedback, setViewingFeedback] = useState<FeedbackItem | null>(null)
  const [archivingIds, setArchivingIds] = useState<Set<string>>(new Set())
  const [batchConfirmAction, setBatchConfirmAction] = useState<'archive' | 'delete' | 'markAsRead' | null>(null)
  
  // Filters state
  const [filters, setFilters] = useState<FeedbackFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  // Convert sorting to filters format
  const listOptions = useMemo(() => {
    const sortColumn = sorting[0]?.id || 'created_at'
    const sortOrder = (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc'
    
    // Handle showUnreadOnly filter
    const effectiveStatus = filters.showUnreadOnly 
      ? undefined // Will be handled by filtering new and read in the query
      : filters.status
    
    return {
      projectId: PROJECT_ID,
      page,
      limit: PAGE_SIZE,
      filters: {
        ...filters,
        status: effectiveStatus,
        sortBy: sortColumn as FeedbackFilters['sortBy'],
        sortOrder,
      },
    }
  }, [page, filters, sorting])

  // React Query hooks
  const { data: feedbacksData, isLoading, error } = useFeedbacks(listOptions)
  const { data: stats } = useFeedbackStats(PROJECT_ID)
  
  // Mutations
  const updateStatusMutation = useUpdateFeedbackStatus()
  const deleteMutation = useDeleteFeedback()
  const batchUpdateMutation = useBatchUpdateStatus()
  const batchDeleteMutation = useBatchDelete()

  // Realtime updates
  useRealtimeFeedbacks(PROJECT_ID, () => {
    toast.info('Novos feedbacks recebidos', {
      description: 'A lista foi atualizada automaticamente.',
    })
  })

  // Get selected IDs from row selection
  const selectedIds = useMemo(() => {
    if (!feedbacksData?.data) return []
    return Object.keys(rowSelection)
      .map(index => feedbacksData.data[parseInt(index)]?.id)
      .filter(Boolean) as string[]
  }, [rowSelection, feedbacksData])

  // Keyboard shortcuts
  useFeedbackKeyboardShortcuts({
    onMarkAsRead: (id) => handleMarkAsRead(id),
    onArchive: (id) => handleArchive(id),
    selectedFeedbackId: viewingFeedback?.id,
    isModalOpen: !!viewingFeedback,
  })

  // Handlers
  const handleFiltersChange = useCallback((newFilters: FeedbackFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback(async (
    id: string, 
    status: FeedbackStatus
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: id, status })
      const statusLabels: Record<FeedbackStatus, string> = {
        new: 'Novo',
        read: 'Lido',
        analyzing: 'Em análise',
        implemented: 'Implementado',
        archived: 'Arquivado',
      }
      
      // Show toast with undo button for archive action
      if (status === 'archived') {
        toast.success(`Feedback arquivado`, {
          action: {
            label: 'Desfazer',
            onClick: () => handleStatusChange(id, 'new'),
          },
        })
      } else {
        toast.success(`Status atualizado para ${statusLabels[status]}`)
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }, [updateStatusMutation])

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: id, status: 'read' })
      // Silent update - no toast for auto-read
    } catch (error) {
      console.error('Erro ao marcar como lido:', error)
    }
  }, [updateStatusMutation])

  const handleArchive = useCallback(async (id: string) => {
    setArchivingIds(prev => new Set(prev).add(id))
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: id, status: 'archived' })
      toast.success('Feedback arquivado', {
        action: {
          label: 'Desfazer',
          onClick: () => handleStatusChange(id, 'new'),
        },
      })
    } catch (error) {
      toast.error('Erro ao arquivar')
    } finally {
      setArchivingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [updateStatusMutation, handleStatusChange])

  const handleRestore = useCallback(async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: id, status: 'new' })
      toast.success('Feedback restaurado')
    } catch (error) {
      toast.error('Erro ao restaurar')
    }
  }, [updateStatusMutation])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este feedback?')) return
    
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Feedback deletado')
    } catch (error) {
      toast.error('Erro ao deletar')
    }
  }, [deleteMutation])

  // Batch handlers with confirmation
  const handleBatchArchive = useCallback(() => {
    setBatchConfirmAction('archive')
  }, [])

  const handleBatchDelete = useCallback(() => {
    setBatchConfirmAction('delete')
  }, [])

  const handleBatchMarkAsRead = useCallback(() => {
    setBatchConfirmAction('markAsRead')
  }, [])

  const handleConfirmBatchAction = useCallback(async () => {
    if (!batchConfirmAction || selectedIds.length === 0) return

    try {
      if (batchConfirmAction === 'delete') {
        await batchDeleteMutation.mutateAsync(selectedIds)
        toast.success(`${selectedIds.length} feedback(s) deletado(s)`)
      } else if (batchConfirmAction === 'archive') {
        await batchUpdateMutation.mutateAsync({ feedbackIds: selectedIds, status: 'archived' })
        toast.success(`${selectedIds.length} feedback(s) arquivado(s)`, {
          action: {
            label: 'Desfazer',
            onClick: () => batchUpdateMutation.mutateAsync({ feedbackIds: selectedIds, status: 'new' }),
          },
        })
      } else if (batchConfirmAction === 'markAsRead') {
        await batchUpdateMutation.mutateAsync({ feedbackIds: selectedIds, status: 'read' })
        toast.success(`${selectedIds.length} feedback(s) marcado(s) como lido(s)`)
      }
      setRowSelection({})
    } catch (error) {
      toast.error('Erro ao executar ação em lote')
    } finally {
      setBatchConfirmAction(null)
    }
  }, [batchConfirmAction, selectedIds, batchDeleteMutation, batchUpdateMutation])

  const handleModalStatusChange = useCallback(async (status: FeedbackStatus) => {
    if (viewingFeedback) {
      await handleStatusChange(viewingFeedback.id, status)
      setViewingFeedback(null)
    }
  }, [viewingFeedback, handleStatusChange])

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 font-medium">Erro ao carregar feedbacks</p>
            <p className="text-gray-500 text-sm mt-1">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedbacks</h1>
            <p className="text-gray-500 mt-1">Gerencie todos os feedbacks recebidos</p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="hidden sm:inline">Atalhos: </span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">E</kbd> Arquivar
            <span className="mx-2">•</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">M</kbd> Marcar lido
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats || { total: 0, new: 0, read: 0, analyzing: 0, implemented: 0, archived: 0 }} isLoading={!stats} />

        {/* Filters */}
        <FeedbackFiltersPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Table */}
        <FeedbackTableV2
          feedbacks={feedbacksData?.data || []}
          isLoading={isLoading}
          totalItems={feedbacksData?.total || 0}
          page={page}
          pageSize={PAGE_SIZE}
          sorting={sorting}
          columnFilters={columnFilters}
          rowSelection={rowSelection}
          onSortingChange={setSorting}
          onColumnFiltersChange={setColumnFilters}
          onRowSelectionChange={setRowSelection}
          onPageChange={setPage}
          onPageSizeChange={(size) => {}}
          onView={setViewingFeedback}
          onStatusChange={handleStatusChange}
          onMarkAsRead={handleMarkAsRead}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onDelete={handleDelete}
          archivingIds={archivingIds}
        />

        {/* Pagination */}
        {!isLoading && feedbacksData && feedbacksData.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={feedbacksData.totalPages}
            onPageChange={setPage}
            totalItems={feedbacksData.total}
            itemsPerPage={PAGE_SIZE}
          />
        )}
      </div>

      {/* Batch Actions */}
      <BatchActions
        selectedCount={selectedIds.length}
        onArchive={handleBatchArchive}
        onDelete={handleBatchDelete}
        onMarkAsRead={handleBatchMarkAsRead}
        onClear={() => setRowSelection({})}
      />

      {/* Batch Confirm Dialog */}
      <BatchConfirmDialog
        isOpen={!!batchConfirmAction}
        onClose={() => setBatchConfirmAction(null)}
        onConfirm={handleConfirmBatchAction}
        action={batchConfirmAction || 'archive'}
        count={selectedIds.length}
      />

      {/* Detail Modal */}
      <FeedbackDetailModal
        feedback={viewingFeedback}
        isOpen={!!viewingFeedback}
        onClose={() => setViewingFeedback(null)}
        onStatusChange={handleModalStatusChange}
        onMarkAsRead={handleMarkAsRead}
      />
    </DashboardLayout>
  )
}
