import { createClient } from '@supabase/supabase-js'
import { 
  AnalyticsSummary, 
  AnalyticsFilters, 
  DateRange,
  VolumeDataPoint,
  NPSDistribution,
  RatingDistribution,
  CategoryCount,
  TypeDistribution,
  ExportOptions
} from '@/types/analytics'
import { FeedbackItem } from '@/types/dashboard-feedback'
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

function getDateRangeFromFilter(dateRange: DateRange, dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
  const now = new Date()
  
  switch (dateRange) {
    case '7d':
      return { from: subDays(now, 7), to: now }
    case '30d':
      return { from: subDays(now, 30), to: now }
    case '90d':
      return { from: subDays(now, 90), to: now }
    case 'custom':
    default:
      return { 
        from: dateFrom ? new Date(dateFrom) : subDays(now, 30), 
        to: dateTo ? new Date(dateTo) : now 
      }
  }
}

function fillMissingDates(data: VolumeDataPoint[], from: Date, to: Date): VolumeDataPoint[] {
  const dateMap = new Map(data.map(d => [d.date, d.count]))
  const allDates = eachDayOfInterval({ start: from, end: to })
  
  return allDates.map(date => ({
    date: format(date, 'yyyy-MM-dd'),
    count: dateMap.get(format(date, 'yyyy-MM-dd')) || 0
  }))
}

export async function getAnalyticsSummary(filters: AnalyticsFilters): Promise<AnalyticsSummary> {
  const { projectId, dateRange, dateFrom, dateTo } = filters
  const { from, to } = getDateRangeFromFilter(dateRange, dateFrom, dateTo)
  
  const fromStr = from.toISOString()
  const toStr = to.toISOString()
  
  // Fetch all feedbacks in the date range
  const { data: feedbacks, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('project_id', projectId)
    .gte('created_at', fromStr)
    .lte('created_at', toStr)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching feedbacks for analytics:', error)
    throw new Error('Failed to fetch analytics data')
  }
  
  const items = feedbacks as FeedbackItem[]
  
  // Calculate NPS distribution
  const npsItems = items.filter(f => f.type === 'nps')
  const detractors = npsItems.filter(f => (f.content.score || 0) <= 6).length
  const neutrals = npsItems.filter(f => {
    const score = f.content.score || 0
    return score >= 7 && score <= 8
  }).length
  const promoters = npsItems.filter(f => (f.content.score || 0) >= 9).length
  const totalNPS = npsItems.length
  
  const npsScore = totalNPS > 0 
    ? Math.round(((promoters / totalNPS) - (detractors / totalNPS)) * 100)
    : 0
  
  // Calculate rating distribution
  const ratingMap = new Map<number, number>()
  for (let i = 0; i <= 10; i++) ratingMap.set(i, 0)
  
  npsItems.forEach(f => {
    const score = f.content.score || 0
    ratingMap.set(score, (ratingMap.get(score) || 0) + 1)
  })
  
  const ratingDistribution: RatingDistribution[] = Array.from(ratingMap.entries())
    .map(([score, count]) => ({
      score,
      count,
      percentage: totalNPS > 0 ? Math.round((count / totalNPS) * 100) : 0
    }))
    .sort((a, b) => b.score - a.score)
  
  // Calculate type distribution
  const typeCounts = items.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const total = items.length
  const typeDistribution: TypeDistribution[] = [
    { type: 'nps', count: typeCounts['nps'] || 0, percentage: total > 0 ? Math.round(((typeCounts['nps'] || 0) / total) * 100) : 0 },
    { type: 'suggestion', count: typeCounts['suggestion'] || 0, percentage: total > 0 ? Math.round(((typeCounts['suggestion'] || 0) / total) * 100) : 0 },
    { type: 'bug', count: typeCounts['bug'] || 0, percentage: total > 0 ? Math.round(((typeCounts['bug'] || 0) / total) * 100) : 0 }
  ]
  
  // Calculate top categories (from suggestions)
  const suggestions = items.filter(f => f.type === 'suggestion')
  const categoryCounts = suggestions.reduce((acc, f) => {
    const category = f.content.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const totalCategories = suggestions.length
  const topCategories: CategoryCount[] = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalCategories > 0 ? Math.round((count / totalCategories) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Calculate volume over time
  const volumeMap = items.reduce((acc, f) => {
    const date = f.created_at.split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const volumeData = Object.entries(volumeMap).map(([date, count]) => ({
    date,
    count
  }))
  
  const volumeOverTime = fillMissingDates(volumeData, from, to)
  
  return {
    totalFeedbacks: total,
    nps: {
      detractors,
      neutrals,
      promoters,
      total: totalNPS,
      score: npsScore
    },
    ratingDistribution,
    typeDistribution,
    topCategories,
    volumeOverTime,
    recentFeedbacks: items.slice(0, 5)
  }
}

export async function getPeriodComparison(
  projectId: string,
  days: number = 30
): Promise<{ current: number; previous: number; change: number }> {
  const now = new Date()
  const currentFrom = subDays(now, days)
  const previousFrom = subDays(now, days * 2)
  
  // Fetch current period
  const { count: currentCount, error: currentError } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', currentFrom.toISOString())
  
  if (currentError) {
    console.error('Error fetching current period:', currentError)
  }
  
  // Fetch previous period
  const { count: previousCount, error: previousError } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gte('created_at', previousFrom.toISOString())
    .lt('created_at', currentFrom.toISOString())
  
  if (previousError) {
    console.error('Error fetching previous period:', previousError)
  }
  
  const current = currentCount || 0
  const previous = previousCount || 0
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0
  
  return { current, previous, change }
}

export async function exportFeedbacksToCSV(options: ExportOptions): Promise<string> {
  const { projectId, dateFrom, dateTo } = options
  
  let query = supabase
    .from('feedbacks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching feedbacks for export:', error)
    throw new Error('Failed to fetch data for export')
  }
  
  const items = data as FeedbackItem[]
  
  // CSV Headers
  const headers = [
    'ID',
    'Type',
    'Status',
    'Priority',
    'Score',
    'Title',
    'Description',
    'Comment',
    'Category',
    'User Email',
    'User Name',
    'Created At',
    'Updated At',
    'URL'
  ]
  
  // CSV Rows
  const rows = items.map(item => [
    item.id,
    item.type,
    item.status,
    item.priority || '',
    item.content.score || '',
    item.content.title || '',
    `"${(item.content.description || '').replace(/"/g, '""')}"`,
    `"${(item.content.comment || '').replace(/"/g, '""')}"`,
    item.content.category || '',
    item.user_email || '',
    item.user_name || '',
    item.created_at,
    item.updated_at,
    item.technical_context?.url || ''
  ])
  
  // Combine headers and rows
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  
  return csv
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Feedback detail view tracking
interface FeedbackViewEvent {
  feedbackId: string
  type: string
  timestamp: number
  duration?: number
}

const viewEvents: FeedbackViewEvent[] = []

export function trackFeedbackView(feedbackId: string, type: string): void {
  const event: FeedbackViewEvent = {
    feedbackId,
    type,
    timestamp: Date.now(),
  }
  
  viewEvents.push(event)
  
  // Keep only last 100 events
  if (viewEvents.length > 100) {
    viewEvents.shift()
  }
  
  // Log for debugging (in production, send to analytics service)
  console.log('[Analytics] Feedback viewed:', { feedbackId, type })
  
  // In production, you would send this to your analytics service
  // Example: analytics.track('Feedback Viewed', { feedbackId, type })
}

export function trackFeedbackAction(
  feedbackId: string, 
  action: 'status_change' | 'email_reply' | 'download_screenshot' | 'view_duration',
  metadata?: Record<string, unknown>
): void {
  const event = {
    feedbackId,
    action,
    metadata,
    timestamp: Date.now(),
  }
  
  console.log('[Analytics] Feedback action:', event)
  
  // In production, you would send this to your analytics service
  // Example: analytics.track(`Feedback ${action}`, { feedbackId, ...metadata })
}

export function getRecentViewEvents(limit: number = 10): FeedbackViewEvent[] {
  return viewEvents.slice(-limit)
}
