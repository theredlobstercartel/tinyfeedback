import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface NpsOverTimeData {
  date: string;
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Validate days parameter (only allow 7, 30, or 90)
    const validDays = [7, 30, 90];
    const periodDays = validDays.includes(days) ? days : 30;

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate start date based on period
    const startDate = new Date(today);
    startDate.setUTCDate(today.getUTCDate() - (periodDays - 1));
    const startDateIso = startDate.toISOString();

    // Query NPS feedbacks within the period
    const { data: npsData, error: npsError } = await supabase
      .from('feedbacks')
      .select('created_at, nps_score')
      .eq('project_id', projectId)
      .eq('type', 'nps')
      .not('nps_score', 'is', null)
      .gte('created_at', startDateIso)
      .order('created_at', { ascending: true });

    if (npsError) {
      console.error('Error fetching NPS data:', npsError);
      return NextResponse.json(
        { error: 'Failed to fetch NPS data' },
        { status: 500 }
      );
    }

    // Initialize data structure for all days in the period
    const npsByDay: Map<string, {
      promoters: number;
      passives: number;
      detractors: number;
      scores: number[];
    }> = new Map();

    // Fill all days with empty data
    for (let i = 0; i < periodDays; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      npsByDay.set(dateKey, {
        promoters: 0,
        passives: 0,
        detractors: 0,
        scores: [],
      });
    }

    // Aggregate NPS data by day
    npsData?.forEach(feedback => {
      const dateKey = feedback.created_at.split('T')[0];
      const score = feedback.nps_score;

      if (npsByDay.has(dateKey)) {
        const dayData = npsByDay.get(dateKey)!;
        dayData.scores.push(score);

        if (score >= 9) {
          dayData.promoters++;
        } else if (score >= 7) {
          dayData.passives++;
        } else {
          dayData.detractors++;
        }
      }
    });

    // Calculate NPS score for each day and format response
    const result: NpsOverTimeData[] = Array.from(npsByDay.entries())
      .map(([date, data]) => {
        const totalResponses = data.promoters + data.passives + data.detractors;
        
        // NPS = % Promoters - % Detractors
        let npsScore: number | null = null;
        if (totalResponses > 0) {
          const promoterPercentage = (data.promoters / totalResponses) * 100;
          const detractorPercentage = (data.detractors / totalResponses) * 100;
          npsScore = Math.round((promoterPercentage - detractorPercentage) * 10) / 10;
        }

        return {
          date,
          npsScore,
          promoters: data.promoters,
          passives: data.passives,
          detractors: data.detractors,
          totalResponses,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: result,
      period: periodDays,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/nps-over-time:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
