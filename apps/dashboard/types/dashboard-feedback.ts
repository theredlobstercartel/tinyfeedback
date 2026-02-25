export interface FeedbackItem {
  id: string
  project_id: string
  type: 'nps' | 'suggestion' | 'bug'
  content: {
    score?: number
    comment?: string
    title?: string
    description?: string
    category?: string
  }
  user_id?: string
  user_email?: string
  user_name?: string
  anonymous_id?: string
  status: 'new' | 'analyzing' | 'implemented' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  technical_context?: {
    url?: string
    userAgent?: string
    viewport?: { width: number; height: number }
    timestamp?: string
  }
  created_at: string
  updated_at: string
}

export interface FeedbackFilters {
  search?: string
  type?: 'nps' | 'suggestion' | 'bug' | 'all'
  status?: 'new' | 'analyzing' | 'implemented' | 'archived' | 'all'
  priority?: 'low' | 'medium' | 'high' | 'all'
  rating?: number | 'all' // For NPS rating filter (1-10)
  dateFrom?: string
  dateTo?: string
  category?: string | 'all'
  sortBy?: 'created_at' | 'updated_at' | 'type' | 'status' | 'priority'
  sortOrder?: 'asc' | 'desc'
}

export interface FeedbackStats {
  total: number
  new: number
  analyzing: number
  implemented: number
  archived: number
}

export type FeedbackAction = 'read' | 'archive' | 'delete'
