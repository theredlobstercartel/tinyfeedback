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
  created_at: string;
  updated_at: string;
}

export interface UpdateProjectDomainsInput {
  action: 'add' | 'remove';
  domain: string;
}

// Re-export Stripe types
export * from './stripe';
