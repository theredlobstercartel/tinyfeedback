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
