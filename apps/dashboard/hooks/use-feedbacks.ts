import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  listFeedbacks,
  getFeedbackStats,
  updateFeedbackStatus,
  deleteFeedback,
  batchUpdateStatus,
  batchDelete,
  ListFeedbacksOptions,
  ListFeedbacksResult,
} from '@/lib/dashboard-feedback-service'
import { FeedbackStats, FeedbackFilters } from '@/types/dashboard-feedback'

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

// Hook for realtime updates
export function useRealtimeFeedbacks(projectId: string, onUpdate?: () => void) {
  const queryClient = useQueryClient()

  useEffect(() => {
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
          
          // Call optional callback
          onUpdate?.()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId, queryClient, onUpdate])
}

// Mutation hooks
export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ feedbackId, status }: { feedbackId: string; status: 'new' | 'analyzing' | 'implemented' | 'archived' }) =>
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
    mutationFn: ({ feedbackIds, status }: { feedbackIds: string[]; status: 'new' | 'analyzing' | 'implemented' | 'archived' }) =>
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
