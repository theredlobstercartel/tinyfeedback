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
import { FeedbackItem, FeedbackFilters } from '@/types/dashboard-feedback'
import {
  useFeedbacks,
  useFeedbackStats,
  useRealtimeFeedbacks,
  useUpdateFeedbackStatus,
  useDeleteFeedback,
  useBatchUpdateStatus,
  useBatchDelete,
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
  
  // Filters state
  const [filters, setFilters] = useState<FeedbackFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  // Convert sorting to filters format
  const listOptions = useMemo(() => {
    const sortColumn = sorting[0]?.id || 'created_at'
    const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'
    
    return {
      projectId: PROJECT_ID,
      page,
      limit: PAGE_SIZE,
      filters: {
        ...filters,
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

  // Handlers
  const handleFiltersChange = useCallback((newFilters: FeedbackFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback(async (
    id: string, 
    status: 'new' | 'analyzing' | 'implemented' | 'archived'
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: id, status })
      toast.success(`Status atualizado para ${getStatusLabel(status)}`)
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }, [updateStatusMutation])

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: id, status: 'analyzing' })
      toast.success('Marcado como lido')
    } catch (error) {
      toast.error('Erro ao marcar como lido')
    }
  }, [updateStatusMutation])

  const handleArchive = useCallback(async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: id, status: 'archived' })
      toast.success('Feedback arquivado')
    } catch (error) {
      toast.error('Erro ao arquivar')
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

  const handleBatchArchive = useCallback(async () => {
    try {
      await batchUpdateMutation.mutateAsync({ feedbackIds: selectedIds, status: 'archived' })
      setRowSelection({})
      toast.success(`${selectedIds.length} feedback(s) arquivado(s)`)
    } catch (error) {
      toast.error('Erro ao arquivar em lote')
    }
  }, [selectedIds, batchUpdateMutation])

  const handleBatchDelete = useCallback(async () => {
    if (!confirm(`Tem certeza que deseja deletar ${selectedIds.length} feedback(s)?`)) return
    
    try {
      await batchDeleteMutation.mutateAsync(selectedIds)
      setRowSelection({})
      toast.success(`${selectedIds.length} feedback(s) deletado(s)`)
    } catch (error) {
      toast.error('Erro ao deletar em lote')
    }
  }, [selectedIds, batchDeleteMutation])

  const handleBatchMarkAsAnalyzing = useCallback(async () => {
    try {
      await batchUpdateMutation.mutateAsync({ feedbackIds: selectedIds, status: 'analyzing' })
      setRowSelection({})
      toast.success(`${selectedIds.length} feedback(s) marcado(s) como em análise`)
    } catch (error) {
      toast.error('Erro ao atualizar em lote')
    }
  }, [selectedIds, batchUpdateMutation])

  const handleModalStatusChange = useCallback(async (status: 'new' | 'analyzing' | 'implemented' | 'archived') => {
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
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats || { total: 0, new: 0, analyzing: 0, implemented: 0, archived: 0 }} isLoading={!stats} />

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
          onDelete={handleDelete}
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
        onMarkAsAnalyzing={handleBatchMarkAsAnalyzing}
        onClear={() => setRowSelection({})}
      />

      {/* Detail Modal */}
      <FeedbackDetailModal
        feedback={viewingFeedback}
        isOpen={!!viewingFeedback}
        onClose={() => setViewingFeedback(null)}
        onStatusChange={handleModalStatusChange}
      />
    </DashboardLayout>
  )
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'Novo',
    analyzing: 'Em análise',
    implemented: 'Implementado',
    archived: 'Arquivado',
  }
  return labels[status] || status
}