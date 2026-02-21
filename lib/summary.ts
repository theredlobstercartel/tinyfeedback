import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface DailySummaryData {
  projectId: string;
  projectName: string;
  date: string;
  totalFeedbacks: number;
  averageNps: number | null;
  npsDistribution: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  highlights: {
    topFeedback: {
      id: string;
      content: string;
      nps_score: number | null;
      type: string;
    } | null;
    recentFeedbacks: Array<{
      id: string;
      content: string;
      type: string;
      nps_score: number | null;
      created_at: string;
    }>;
  };
}

/**
 * Generate daily summary data for a project
 */
export async function generateDailySummary(
  projectId: string,
  date: Date = new Date()
): Promise<DailySummaryData | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get project info
  const { data: project, error: projectError } = await supabase
    .from('bmad_projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    console.error('Error fetching project:', projectError);
    return null;
  }

  // Get start and end of the specified day
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  // Get feedbacks from the day
  const { data: feedbacks, error: feedbacksError } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('project_id', projectId)
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: false });

  if (feedbacksError) {
    console.error('Error fetching feedbacks:', feedbacksError);
    return null;
  }

  const totalFeedbacks = feedbacks?.length || 0;

  // Calculate NPS metrics
  const npsFeedbacks = feedbacks?.filter(f => f.type === 'nps' && f.nps_score !== null) || [];
  const npsScores = npsFeedbacks.map(f => f.nps_score).filter((s): s is number => s !== null);
  
  const averageNps = npsScores.length > 0
    ? Math.round((npsScores.reduce((a, b) => a + b, 0) / npsScores.length) * 10) / 10
    : null;

  const promoters = npsScores.filter(s => s >= 9).length;
  const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
  const detractors = npsScores.filter(s => s <= 6).length;

  // Get top feedback (highest NPS score or most recent if no NPS)
  const topNpsFeedback = npsFeedbacks.length > 0
    ? npsFeedbacks.reduce((max, f) => (f.nps_score! > max.nps_score! ? f : max))
    : null;

  const topFeedback = topNpsFeedback || (feedbacks?.length > 0 ? feedbacks[0] : null);

  // Get recent feedbacks (up to 5)
  const recentFeedbacks = feedbacks?.slice(0, 5).map(f => ({
    id: f.id,
    content: f.content.substring(0, 200) + (f.content.length > 200 ? '...' : ''),
    type: f.type,
    nps_score: f.nps_score,
    created_at: f.created_at,
  })) || [];

  return {
    projectId: project.id,
    projectName: project.name,
    date: startOfDay.toISOString().split('T')[0],
    totalFeedbacks,
    averageNps,
    npsDistribution: {
      promoters,
      passives,
      detractors,
    },
    highlights: {
      topFeedback: topFeedback ? {
        id: topFeedback.id,
        content: topFeedback.content.substring(0, 300) + (topFeedback.content.length > 300 ? '...' : ''),
        nps_score: topFeedback.nps_score,
        type: topFeedback.type,
      } : null,
      recentFeedbacks,
    },
  };
}

/**
 * Generate weekly summary data for a project
 */
export async function generateWeeklySummary(
  projectId: string,
  date: Date = new Date()
): Promise<DailySummaryData | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get project info
  const { data: project, error: projectError } = await supabase
    .from('bmad_projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    console.error('Error fetching project:', projectError);
    return null;
  }

  // Get start of week (Sunday) and end of week (Saturday)
  const endOfWeek = new Date(date);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  
  const startOfWeek = new Date(date);
  startOfWeek.setUTCDate(date.getUTCDate() - date.getUTCDay());
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const startIso = startOfWeek.toISOString();
  const endIso = endOfWeek.toISOString();

  // Get feedbacks from the week
  const { data: feedbacks, error: feedbacksError } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('project_id', projectId)
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .order('created_at', { ascending: false });

  if (feedbacksError) {
    console.error('Error fetching feedbacks:', feedbacksError);
    return null;
  }

  const totalFeedbacks = feedbacks?.length || 0;

  // Calculate NPS metrics
  const npsFeedbacks = feedbacks?.filter(f => f.type === 'nps' && f.nps_score !== null) || [];
  const npsScores = npsFeedbacks.map(f => f.nps_score).filter((s): s is number => s !== null);
  
  const averageNps = npsScores.length > 0
    ? Math.round((npsScores.reduce((a, b) => a + b, 0) / npsScores.length) * 10) / 10
    : null;

  const promoters = npsScores.filter(s => s >= 9).length;
  const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
  const detractors = npsScores.filter(s => s <= 6).length;

  // Get top feedback
  const topNpsFeedback = npsFeedbacks.length > 0
    ? npsFeedbacks.reduce((max, f) => (f.nps_score! > max.nps_score! ? f : max))
    : null;

  const topFeedback = topNpsFeedback || (feedbacks?.length > 0 ? feedbacks[0] : null);

  // Get recent feedbacks (up to 10 for weekly)
  const recentFeedbacks = feedbacks?.slice(0, 10).map(f => ({
    id: f.id,
    content: f.content.substring(0, 200) + (f.content.length > 200 ? '...' : ''),
    type: f.type,
    nps_score: f.nps_score,
    created_at: f.created_at,
  })) || [];

  return {
    projectId: project.id,
    projectName: project.name,
    date: `${startOfWeek.toISOString().split('T')[0]} a ${endOfWeek.toISOString().split('T')[0]}`,
    totalFeedbacks,
    averageNps,
    npsDistribution: {
      promoters,
      passives,
      detractors,
    },
    highlights: {
      topFeedback: topFeedback ? {
        id: topFeedback.id,
        content: topFeedback.content.substring(0, 300) + (topFeedback.content.length > 300 ? '...' : ''),
        nps_score: topFeedback.nps_score,
        type: topFeedback.type,
      } : null,
      recentFeedbacks,
    },
  };
}
