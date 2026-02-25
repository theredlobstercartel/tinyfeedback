import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface AnalyticsData {
  totalFeedbacks: number;
  averageNps: number | null;
  feedbacksToday: number;
  feedbacksThisWeek: number;
  feedbacksThisMonth: number;
  npsDistribution: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  typeDistribution: {
    nps: number;
    suggestion: number;
    bug: number;
  };
  recentTrend: {
    date: string;
    count: number;
  }[];
  volumeData: {
    date: string;
    count: number;
  }[];
  npsOverTime: {
    date: string;
    npsScore: number | null;
    promoters: number;
    passives: number;
    detractors: number;
    totalResponses: number;
  }[];
  // ST-09: Response Rate metric
  responseRate: {
    total: number;
    responded: number;
    rate: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    // Get start of week (Sunday)
    const weekStart = new Date(today);
    weekStart.setUTCDate(today.getUTCDate() - today.getUTCDay());
    const weekStartIso = weekStart.toISOString();

    // Get start of month
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthStartIso = monthStart.toISOString();

    // Get last 7 days for trend
    const last7DaysStart = new Date(today);
    last7DaysStart.setUTCDate(today.getUTCDate() - 6);
    const last7DaysStartIso = last7DaysStart.toISOString();

    // Get last 30 days for volume chart
    const last30DaysStart = new Date(today);
    last30DaysStart.setUTCDate(today.getUTCDate() - 29);
    const last30DaysStartIso = last30DaysStart.toISOString();

    // Get last 90 days for NPS over time
    const last90DaysStart = new Date(today);
    last90DaysStart.setUTCDate(today.getUTCDate() - 89);
    const last90DaysStartIso = last90DaysStart.toISOString();

    // Query 1: Total feedbacks
    const { count: totalFeedbacks, error: totalError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (totalError) {
      console.error('Error fetching total feedbacks:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Query 2: Average NPS (only for NPS type feedbacks with scores)
    const { data: npsData, error: npsError } = await supabase
      .from('feedbacks')
      .select('nps_score')
      .eq('project_id', projectId)
      .eq('type', 'nps')
      .not('nps_score', 'is', null);

    if (npsError) {
      console.error('Error fetching NPS data:', npsError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Calculate average NPS
    const npsScores = npsData?.map(f => f.nps_score).filter((s): s is number => s !== null) || [];
    const averageNps = npsScores.length > 0 
      ? Math.round((npsScores.reduce((a, b) => a + b, 0) / npsScores.length) * 10) / 10
      : null;

    // Calculate NPS distribution
    const promoters = npsScores.filter(s => s >= 9).length;
    const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
    const detractors = npsScores.filter(s => s <= 6).length;

    // Query 3: Type distribution (NPS, Suggestion, Bug)
    const { data: typeData, error: typeError } = await supabase
      .from('feedbacks')
      .select('type')
      .eq('project_id', projectId);

    if (typeError) {
      console.error('Error fetching type distribution:', typeError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Calculate type distribution
    const typeDistribution = {
      nps: typeData?.filter(f => f.type === 'nps').length || 0,
      suggestion: typeData?.filter(f => f.type === 'suggestion').length || 0,
      bug: typeData?.filter(f => f.type === 'bug').length || 0,
    };

    // Query 3: Feedbacks today
    const { count: feedbacksToday, error: todayError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', todayIso);

    if (todayError) {
      console.error('Error fetching today feedbacks:', todayError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Query 4: Feedbacks this week
    const { count: feedbacksThisWeek, error: weekError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', weekStartIso);

    if (weekError) {
      console.error('Error fetching week feedbacks:', weekError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Query 5: Feedbacks this month
    const { count: feedbacksThisMonth, error: monthError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', monthStartIso);

    if (monthError) {
      console.error('Error fetching month feedbacks:', monthError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Query 6: Recent trend (last 7 days)
    const { data: trendData, error: trendError } = await supabase
      .from('feedbacks')
      .select('created_at')
      .eq('project_id', projectId)
      .gte('created_at', last7DaysStartIso)
      .order('created_at', { ascending: true });

    if (trendError) {
      console.error('Error fetching trend data:', trendError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Process trend data into daily counts
    const trendMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendMap.set(dateKey, 0);
    }

    trendData?.forEach(feedback => {
      const dateKey = feedback.created_at.split('T')[0];
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    });

    const recentTrend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Query 7: Volume data (last 30 days)
    const { data: volumeDataRaw, error: volumeError } = await supabase
      .from('feedbacks')
      .select('created_at')
      .eq('project_id', projectId)
      .gte('created_at', last30DaysStartIso)
      .order('created_at', { ascending: true });

    if (volumeError) {
      console.error('Error fetching volume data:', volumeError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Process volume data into daily counts
    const volumeMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      volumeMap.set(dateKey, 0);
    }

    volumeDataRaw?.forEach(feedback => {
      const dateKey = feedback.created_at.split('T')[0];
      volumeMap.set(dateKey, (volumeMap.get(dateKey) || 0) + 1);
    });

    const volumeData = Array.from(volumeMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Query 8: NPS over time (last 90 days)
    const { data: npsTimeDataRaw, error: npsTimeError } = await supabase
      .from('feedbacks')
      .select('created_at, nps_score')
      .eq('project_id', projectId)
      .eq('type', 'nps')
      .not('nps_score', 'is', null)
      .gte('created_at', last90DaysStartIso)
      .order('created_at', { ascending: true });

    if (npsTimeError) {
      console.error('Error fetching NPS time data:', npsTimeError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Process NPS data into daily averages
    const npsTimeMap = new Map<string, { scores: number[]; count: number }>();
    
    // Initialize all days in the range
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      npsTimeMap.set(dateKey, { scores: [], count: 0 });
    }

    // Aggregate NPS scores by day
    npsTimeDataRaw?.forEach(feedback => {
      const dateKey = feedback.created_at.split('T')[0];
      const entry = npsTimeMap.get(dateKey);
      if (entry && feedback.nps_score !== null) {
        entry.scores.push(feedback.nps_score);
        entry.count++;
      }
    });

    // Calculate daily averages and format data
    const npsOverTime = Array.from(npsTimeMap.entries())
      .map(([date, data]) => {
        const npsScore = data.scores.length > 0 
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
          : null;
        
        // Calculate promoters, passives, detractors
        const dayPromoters = data.scores.filter(s => s >= 9).length;
        const dayPassives = data.scores.filter(s => s >= 7 && s <= 8).length;
        const dayDetractors = data.scores.filter(s => s <= 6).length;
        
        return {
          date,
          npsScore,
          promoters: dayPromoters,
          passives: dayPassives,
          detractors: dayDetractors,
          totalResponses: data.count,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Query 9: Response Rate - ST-09
    const { count: respondedCount, error: respondedError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('response_sent', true);

    if (respondedError) {
      console.error('Error fetching responded feedbacks:', respondedError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    const total = totalFeedbacks || 0;
    const responded = respondedCount || 0;
    const rate = total > 0 ? Math.round((responded / total) * 100) : 0;

    const analyticsData: AnalyticsData = {
      totalFeedbacks: total,
      averageNps,
      feedbacksToday: feedbacksToday || 0,
      feedbacksThisWeek: feedbacksThisWeek || 0,
      feedbacksThisMonth: feedbacksThisMonth || 0,
      npsDistribution: {
        promoters,
        passives,
        detractors,
      },
      typeDistribution,
      recentTrend,
      volumeData,
      npsOverTime,
      responseRate: {
        total,
        responded,
        rate,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error in GET /api/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
