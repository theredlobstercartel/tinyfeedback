import { createClient } from '@supabase/supabase-js'
import { FeedbackItem, FeedbackStats, FeedbackFilters as FeedbackFiltersType } from '@/types/dashboard-feedback'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

export interface ListFeedbacksOptions {
  projectId: string
  page?: number
  limit?: number
  filters?: FeedbackFiltersType
}

export interface ListFeedbacksResult {
  data: FeedbackItem[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

export async function listFeedbacks({
  projectId,
  page = 1,
  limit = 20,
  filters = {},
}: ListFeedbacksOptions): Promise<ListFeedbacksResult> {
  let query = supabase
    .from('feedbacks')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)

  // Apply type filter
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }

  // Apply status filter
  if (filters.showUnreadOnly) {
    // Show only new and read (not archived, analyzing, or implemented)
    query = query.in('status', ['new', 'read'])
  } else if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  // Apply priority filter
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  // Apply rating filter (for NPS)
  if (filters.rating && filters.rating !== 'all') {
    query = query.eq('content->>score', filters.rating)
  }

  // Apply category filter
  if (filters.category && filters.category !== 'all') {
    query = query.eq('content->>category', filters.category)
  }

  // Apply date range filter
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  // Apply search filter - search in user data AND content
  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    // Search in user_email, user_name, and content fields (using ilike for case-insensitive)
    query = query.or(
      `user_email.ilike.${searchTerm},user_name.ilike.${searchTerm},content->>description.ilike.${searchTerm},content->>title.ilike.${searchTerm},content->>comment.ilike.${searchTerm}`
    )
  }

  // Apply sorting
  const sortBy = filters.sortBy || 'created_at'
  const sortOrder = filters.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching feedbacks:', error)
    throw new Error('Failed to fetch feedbacks')
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    data: data as FeedbackItem[],
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  }
}

export async function getFeedbackStats(projectId: string): Promise<FeedbackStats> {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('status')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error fetching stats:', error)
    throw new Error('Failed to fetch stats')
  }

  const stats = {
    total: data.length,
    new: data.filter(f => f.status === 'new').length,
    read: data.filter(f => f.status === 'read').length,
    analyzing: data.filter(f => f.status === 'analyzing').length,
    implemented: data.filter(f => f.status === 'implemented').length,
    archived: data.filter(f => f.status === 'archived').length,
  }

  return stats
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'new' | 'analyzing' | 'implemented' | 'archived'
): Promise<void> {
  const { error } = await supabase
    .from('feedbacks')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', feedbackId)

  if (error) {
    console.error('Error updating feedback:', error)
    throw new Error('Failed to update feedback')
  }
}

export async function deleteFeedback(feedbackId: string): Promise<void> {
  const { error } = await supabase
    .from('feedbacks')
    .delete()
    .eq('id', feedbackId)

  if (error) {
    console.error('Error deleting feedback:', error)
    throw new Error('Failed to delete feedback')
  }
}

export async function batchUpdateStatus(
  feedbackIds: string[],
  status: 'new' | 'analyzing' | 'implemented' | 'archived'
): Promise<void> {
  const { error } = await supabase
    .from('feedbacks')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .in('id', feedbackIds)

  if (error) {
    console.error('Error batch updating feedbacks:', error)
    throw new Error('Failed to update feedbacks')
  }
}

export async function batchDelete(feedbackIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('feedbacks')
    .delete()
    .in('id', feedbackIds)

  if (error) {
    console.error('Error batch deleting feedbacks:', error)
    throw new Error('Failed to delete feedbacks')
  }
}

// Get unread count (new feedbacks)
export async function getUnreadCount(projectId: string): Promise<number> {
  const { count, error } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('status', 'new')

  if (error) {
    console.error('Error fetching unread count:', error)
    throw new Error('Failed to fetch unread count')
  }

  return count || 0
}

// Optimized query for large datasets - uses cursor-based pagination
export async function listFeedbacksInfinite({
  projectId,
  cursor,
  limit = 20,
  filters = {},
}: {
  projectId: string
  cursor?: string
  limit?: number
  filters?: FeedbackFiltersType
}): Promise<{
  data: FeedbackItem[]
  nextCursor: string | null
  hasMore: boolean
}> {
  let query = supabase
    .from('feedbacks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit + 1) // Fetch one extra to check if there's more

  // Apply cursor
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  // Apply other filters
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(
      `user_email.ilike.${searchTerm},user_name.ilike.${searchTerm},content->>description.ilike.${searchTerm},content->>title.ilike.${searchTerm},content->>comment.ilike.${searchTerm}`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching feedbacks:', error)
    throw new Error('Failed to fetch feedbacks')
  }

  const hasMore = data.length > limit
  const items = hasMore ? data.slice(0, -1) : data
  const nextCursor = hasMore && items.length > 0 
    ? items[items.length - 1].created_at 
    : null

  return {
    data: items as FeedbackItem[],
    nextCursor,
    hasMore,
  }
}
