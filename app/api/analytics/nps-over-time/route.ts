import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface NpsOverTimeData {
  date: string;
  nps: number | null;
  responses: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const period = searchParams.get('period') || '30d';

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Validate period
    const validPeriods = ['7d', '30d', '90d'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use 7d, 30d, or 90d' },
        { status: 400 }
      );
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range
    const days = parseInt(period.replace('d', ''));
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days + 1);
    startDate.setUTCHours(0, 0, 0, 0);

    // Query NPS feedbacks within date range
    const { data: feedbacks, error } = await supabase
      .from('feedbacks')
      .select('nps_score, created_at')
      .eq('project_id', projectId)
      .eq('type', 'nps')
      .not('nps_score', 'is', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching NPS data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch NPS data' },
        { status: 500 }
      );
    }

    // Group by date and calculate daily NPS average
    const dailyNps = new Map<string, { scores: number[] }>();
    
    // Initialize all dates in range with null
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyNps.set(dateStr, { scores: [] });
    }

    // Aggregate scores by date
    feedbacks?.forEach((feedback) => {
      const dateStr = feedback.created_at.split('T')[0];
      if (dailyNps.has(dateStr)) {
        dailyNps.get(dateStr)!.scores.push(feedback.nps_score);
      }
    });

    // Calculate daily averages - convert to format expected by frontend
    const result = Array.from(dailyNps.entries())
      .map(([date, data]) => ({
        date,
        avgNps: data.scores.length > 0 
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
          : 0,
        count: data.scores.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: result,
      period,
      days,
    });
  } catch (error) {
    console.error('Error in NPS over time API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
