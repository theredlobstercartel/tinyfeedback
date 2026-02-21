import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface NpsOverTimeResponse {
  data: {
    date: string;
    npsScore: number | null;
    promoters: number;
    passives: number;
    detractors: number;
    totalResponses: number;
  }[];
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

    // Validate days parameter
    if (![7, 30, 90].includes(days)) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be 7, 30, or 90' },
        { status: 400 }
      );
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get start date based on requested period
    const startDate = new Date(today);
    startDate.setUTCDate(today.getUTCDate() - (days - 1));
    const startDateIso = startDate.toISOString();

    // Query NPS data for the period
    const { data: npsDataRaw, error: npsError } = await supabase
      .from('feedbacks')
      .select('created_at, nps_score')
      .eq('project_id', projectId)
      .eq('type', 'nps')
      .not('nps_score', 'is', null)
      .gte('created_at', startDateIso)
      .order('created_at', { ascending: true });

    if (npsError) {
      console.error('Error fetching NPS over time data:', npsError);
      return NextResponse.json(
        { error: 'Failed to fetch NPS data' },
        { status: 500 }
      );
    }

    // Process NPS data into daily aggregates
    const npsTimeMap = new Map<string, { scores: number[]; count: number }>();
    
    // Initialize all days in the range
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      npsTimeMap.set(dateKey, { scores: [], count: 0 });
    }

    // Aggregate NPS scores by day
    npsDataRaw?.forEach(feedback => {
      const dateKey = feedback.created_at.split('T')[0];
      const entry = npsTimeMap.get(dateKey);
      if (entry && feedback.nps_score !== null) {
        entry.scores.push(feedback.nps_score);
        entry.count++;
      }
    });

    // Calculate daily averages and format data
    const data = Array.from(npsTimeMap.entries())
      .map(([date, dayData]) => {
        const npsScore = dayData.scores.length > 0 
          ? Math.round((dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length) * 10) / 10
          : null;
        
        // Calculate promoters, passives, detractors
        const promoters = dayData.scores.filter(s => s >= 9).length;
        const passives = dayData.scores.filter(s => s >= 7 && s <= 8).length;
        const detractors = dayData.scores.filter(s => s <= 6).length;
        
        return {
          date,
          npsScore,
          promoters,
          passives,
          detractors,
          totalResponses: dayData.count,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const response: NpsOverTimeResponse = { data };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/analytics/nps-over-time:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
