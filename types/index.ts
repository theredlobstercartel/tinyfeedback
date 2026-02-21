export interface Feedback {
  id: string;
  project_id: string;
  type: 'nps' | 'suggestion' | 'bug';
  nps_score: number | null;
  title: string | null;
  content: string;
  screenshot_url: string | null;
  user_email: string | null;
  user_id: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: string;
  internal_notes: string | null;
  response_sent: boolean;
  response_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackInput {
  project_id: string;
  type: 'nps' | 'suggestion' | 'bug';
  nps_score?: number;
  title?: string;
  content: string;
  screenshot_url?: string;
  user_email?: string;
  user_id?: string;
  page_url?: string;
  user_agent?: string;
}

export interface UpdateFeedbackInput {
  status?: string;
  internal_notes?: string;
  response_sent?: boolean;
  response_content?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  user_id: string;
  widget_color: string;
  widget_position: string;
  widget_text: string;
  allowed_domains: string[];
  plan: string;
  feedbacks_count: number;
  max_feedbacks: number;
  // ST-29: Monthly feedback counter for Free plan
  monthly_feedbacks_count: number;
  monthly_feedbacks_reset_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_period_start: string | null;
  subscription_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProjectDomainsInput {
  action: 'add' | 'remove';
  domain: string;
}

// Notification Preferences Types - ST-28
export type FeedbackType = 'nps' | 'suggestion' | 'bug';

export interface NotificationPreferences {
  id: string;
  project_id: string;
  notify_nps: boolean;
  notify_suggestion: boolean;
  notify_bug: boolean;
  // ST-27: Summary preferences
  daily_summary_enabled: boolean;
  weekly_summary_enabled: boolean;
  summary_email: string | null;
  last_daily_summary_sent: string | null;
  last_weekly_summary_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationPreferencesInput {
  notify_nps?: boolean;
  notify_suggestion?: boolean;
  notify_bug?: boolean;
  // ST-27: Summary preferences
  daily_summary_enabled?: boolean;
  weekly_summary_enabled?: boolean;
  summary_email?: string | null;
}

export interface NotificationTypeConfig {
  type: FeedbackType;
  label: string;
  description: string;
  field: 'notify_nps' | 'notify_suggestion' | 'notify_bug';
}

// Summary Settings Types - ST-27
export interface SummarySettings {
  summary_enabled: boolean;
  summary_frequency: 'daily' | 'weekly';
  summary_email: string | null;
  last_summary_sent_at: string | null;
}

export interface UpdateSummarySettingsInput {
  summary_enabled?: boolean;
  summary_frequency?: 'daily' | 'weekly';
  summary_email?: string | null;
}

export interface SummaryLog {
  id: string;
  project_id: string;
  summary_type: 'daily' | 'weekly';
  total_feedbacks: number;
  avg_nps: number | null;
  highlights: SummaryHighlight[];
  sent_at: string;
  created_at: string;
}

export interface SummaryHighlight {
  type: 'nps' | 'suggestion' | 'bug';
  title: string;
  content: string;
  nps_score?: number;
}

export interface DailySummary {
  project_name: string;
  date: string;
  total_feedbacks: number;
  avg_nps: number | null;
  new_nps_count: number;
  new_suggestions_count: number;
  new_bugs_count: number;
  highlights: SummaryHighlight[];
}
