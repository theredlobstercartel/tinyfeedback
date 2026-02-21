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
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationPreferencesInput {
  notify_nps?: boolean;
  notify_suggestion?: boolean;
  notify_bug?: boolean;
}

export interface NotificationTypeConfig {
  type: FeedbackType;
  label: string;
  description: string;
  field: 'notify_nps' | 'notify_suggestion' | 'notify_bug';
}
