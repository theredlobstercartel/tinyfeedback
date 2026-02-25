import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  listFeedbacks,
  getFeedbackStats,
  getUnreadCount,
  updateFeedbackStatus,
  deleteFeedback,
  batchUpdateStatus,
  batchDelete,
  ListFeedbacksOptions,
  ListFeedbacksResult,
} from '@/lib/dashboard-feedback-service'
import { FeedbackStats, FeedbackFilters, FeedbackStatus } from '@/types/dashboard-feedback'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client for realtime
const supabase = createClient(supabaseUrl, supabaseKey)

// Query keys
export const feedbackKeys = {
  all: ['feedbacks'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
  list: (filters: ListFeedbacksOptions) => [...feedbackKeys.lists(), filters] as const,
  stats: (projectId: string) => [...feedbackKeys.all, 'stats', projectId] as const,
  unread: (projectId: string) => [...feedbackKeys.all, 'unread', projectId] as const,
}

// Hook for fetching feedbacks with pagination and filters
export function useFeedbacks(options: ListFeedbacksOptions, queryOptions?: Omit<UseQueryOptions<ListFeedbacksResult, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: feedbackKeys.list(options),
    queryFn: () => listFeedbacks(options),
    ...queryOptions,
  })
}

// Hook for fetching feedback stats
export function useFeedbackStats(projectId: string, queryOptions?: Omit<UseQueryOptions<FeedbackStats, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: feedbackKeys.stats(projectId),
    queryFn: () => getFeedbackStats(projectId),
    ...queryOptions,
  })
}

// Hook for fetching unread count
export function useUnreadCount(projectId: string, queryOptions?: Omit<UseQueryOptions<number, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: feedbackKeys.unread(projectId),
    queryFn: () => getUnreadCount(projectId),
    ...queryOptions,
  })
}

// Hook for realtime updates with unread count
export function useRealtimeFeedbacks(projectId: string, onUpdate?: () => void) {
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Initial fetch of unread count
    getUnreadCount(projectId).then(setUnreadCount).catch(console.error)

    const channel = supabase
      .channel('feedbacks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedbacks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload)
          
          // Invalidate all feedback queries
          queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
          
          // Update unread count
          getUnreadCount(projectId).then(setUnreadCount).catch(console.error)
          
          // Call optional callback
          onUpdate?.()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, queryClient, onUpdate])

  return { unreadCount }
}

// Hook for keyboard shortcuts
export function useFeedbackKeyboardShortcuts({
  onMarkAsRead,
  onArchive,
  selectedFeedbackId,
  isModalOpen,
}: {
  onMarkAsRead?: (id: string) => void
  onArchive?: (id: string) => void
  selectedFeedbackId?: string | null
  isModalOpen?: boolean
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or when modal is open
      if (
        isModalOpen ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Only trigger if we have a selected feedback
      if (!selectedFeedbackId) return

      const key = event.key.toLowerCase()

      if (key === 'e' && onArchive) {
        event.preventDefault()
        onArchive(selectedFeedbackId)
      }

      if (key === 'm' && onMarkAsRead) {
        event.preventDefault()
        onMarkAsRead(selectedFeedbackId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onMarkAsRead, onArchive, selectedFeedbackId, isModalOpen])
}

// Mutation hooks
export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ feedbackId, status }: { feedbackId: string; status: FeedbackStatus }) =>
      updateFeedbackStatus(feedbackId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })
}

export function useBatchUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ feedbackIds, status }: { feedbackIds: string[]; status: FeedbackStatus }) =>
      batchUpdateStatus(feedbackIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })
}

export function useBatchDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })
}
