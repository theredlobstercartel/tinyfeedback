'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  LogOut, 
  Loader2, 
  Sparkles, 
  ArrowLeft,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Calendar
} from 'lucide-react';
import type { Project } from '@/types';
import { StatCard, NpsGauge, TrendChart, VolumeChart, TypeDistribution, NpsOverTimeChart } from '@/components/analytics';

interface NpsOverTimeDataPoint {
  date: string;
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

interface AnalyticsData {
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
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // NPS Over Time state
  const [npsOverTimeData, setNpsOverTimeData] = useState<NpsOverTimeDataPoint[]>([]);
  const [npsPeriod, setNpsPeriod] = useState<number>(30);
  const [isNpsLoading, setIsNpsLoading] = useState(false);

  // Load user and project
  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      
      const { data: project } = await supabase
        .from('bmad_projects')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProject(project);
    };

    loadUserData();
  }, [router]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!project?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics?project_id=${project.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  // Load analytics when project is available
  useEffect(() => {
    if (project?.id) {
      loadAnalytics();
    }
  }, [project?.id, loadAnalytics]);

  // Load NPS over time data
  const loadNpsOverTime = useCallback(async () => {
    if (!project?.id) return;

    setIsNpsLoading(true);

    try {
      const response = await fetch(`/api/analytics/nps-over-time?project_id=${project.id}&days=${npsPeriod}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch NPS data');
      }

      const data = await response.json();
      setNpsOverTimeData(data.data);
    } catch (err) {
      console.error('Error loading NPS over time:', err);
      // Don't set error state - NPS chart can fail independently
    } finally {
      setIsNpsLoading(false);
    }
  }, [project?.id, npsPeriod]);

  // Load NPS over time when project or period changes
  useEffect(() => {
    if (project?.id) {
      loadNpsOverTime();
    }
  }, [project?.id, npsPeriod, loadNpsOverTime]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isPro = project?.plan === 'pro' && project?.subscription_status === 'active';

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#00ff88' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header 
          className="flex items-center justify-between p-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#888888',
                border: '1px solid #444444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
                e.currentTarget.style.color = '#00ff88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#444444';
                e.currentTarget.style.color = '#888888';
              }}
            >
              <ArrowLeft size={18} />
              Voltar
            </a>
            
            <div>
              <h1 
                className="text-2xl font-bold neon-text"
                style={{ color: '#00ff88' }}
              >
                Analytics
              </h1>
              <p style={{ color: '#888888' }}>
                Métricas e estatísticas do seu produto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p style={{ color: '#ffffff' }}>
                {user?.email}
              </p>
              <div className="flex items-center gap-2 justify-end">
                {isPro ? (
                  <span 
                    className="flex items-center gap-1 text-xs font-medium px-2 py-0.5"
                    style={{ 
                      color: '#00ff88', 
                      border: '1px solid #00ff88',
                      backgroundColor: 'rgba(0, 255, 136, 0.1)'
                    }}
                  >
                    <Sparkles size={12} />
                    PRO
                  </span>
                ) : (
                  <span style={{ color: '#888888', fontSize: '0.875rem' }}>
                    Free
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#ff4444',
                border: '1px solid #ff4444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div 
            className="p-4"
            style={{ 
              backgroundColor: 'rgba(255, 68, 68, 0.1)', 
              border: '1px solid #ff4444',
              color: '#ff4444'
            }}
          >
            <p>{error}</p>
          </div>
        )}

        {/* Main Stats - AC-01, AC-02 */}
        {analytics && (
          <>
            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total de Feedbacks"
                value={analytics.totalFeedbacks.toLocaleString('pt-BR')}
                subtitle="Desde o início"
                icon={MessageSquare}
                iconColor="#00ff88"
              />

              <StatCard
                title="Média NPS"
                value={analytics.averageNps?.toFixed(1) ?? '-'}
                subtitle={analytics.averageNps ? 'Baseado em respostas NPS' : 'Sem dados de NPS'}
                icon={BarChart3}
                iconColor="#00d4ff"
              />

              <StatCard
                title="Feedbacks Hoje"
                value={analytics.feedbacksToday}
                subtitle={`${analytics.feedbacksThisWeek} esta semana`}
                icon={Calendar}
                iconColor="#ffd700"
              />
            </div>

            {/* Secondary Stats & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* NPS Gauge */}
              <NpsGauge score={analytics.averageNps} />

              {/* Type Distribution */}
              <TypeDistribution distribution={analytics.typeDistribution} />
            </div>

            {/* Trend Chart */}
            <div className="grid grid-cols-1 gap-6">
              <TrendChart data={analytics.recentTrend} />
            </div>

            {/* Volume Chart - Full Width */}
            <VolumeChart data={analytics.volumeData} />

            {/* NPS Over Time Chart - Full Width */}
            <NpsOverTimeChart
              data={npsOverTimeData}
              period={npsPeriod}
              onPeriodChange={setNpsPeriod}
              isLoading={isNpsLoading}
            />

            {/* Additional Metrics */}
            <div 
              className="p-6"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <h3 style={{ 
                color: '#ffffff', 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingUp size={20} style={{ color: '#00ff88' }} />
                Resumo de Períodos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  className="p-4 text-center"
                  style={{ 
                    backgroundColor: '#000000',
                    border: '1px solid #222222' 
                  }}
                >
                  <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Hoje
                  </p>
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: '#00ff88' }}
                  >
                    {analytics.feedbacksToday}
                  </p>
                  <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    feedbacks
                  </p>
                </div>

                <div 
                  className="p-4 text-center"
                  style={{ 
                    backgroundColor: '#000000',
                    border: '1px solid #222222' 
                  }}
                >
                  <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Esta Semana
                  </p>
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: '#00d4ff' }}
                  >
                    {analytics.feedbacksThisWeek}
                  </p>
                  <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    feedbacks
                  </p>
                </div>

                <div 
                  className="p-4 text-center"
                  style={{ 
                    backgroundColor: '#000000',
                    border: '1px solid #222222' 
                  }}
                >
                  <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Este Mês
                  </p>
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: '#ffd700' }}
                  >
                    {analytics.feedbacksThisMonth}
                  </p>
                  <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    feedbacks
                  </p>
                </div>
              </div>
            </div>

            {/* NPS Distribution */}
            {analytics.npsDistribution && (
              <div 
                className="p-6"
                style={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #222222' 
                }}
              >
                <h3 style={{ 
                  color: '#ffffff', 
                  fontSize: '1.125rem', 
                  fontWeight: 600, 
                  marginBottom: '1.5rem'
                }}
                >
                  Distribuição NPS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    className="p-4 text-center"
                    style={{ 
                      backgroundColor: 'rgba(0, 255, 136, 0.05)',
                      border: '1px solid #00ff88' 
                    }}
                  >
                    <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Promotores
                    </p>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: '#00ff88' }}
                    >
                      {analytics.npsDistribution.promoters}
                    </p>
                    <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Notas 9-10
                    </p>
                  </div>

                  <div 
                    className="p-4 text-center"
                    style={{ 
                      backgroundColor: 'rgba(255, 215, 0, 0.05)',
                      border: '1px solid #ffd700' 
                    }}
                  >
                    <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Neutros
                    </p>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: '#ffd700' }}
                    >
                      {analytics.npsDistribution.passives}
                    </p>
                    <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Notas 7-8
                    </p>
                  </div>

                  <div 
                    className="p-4 text-center"
                    style={{ 
                      backgroundColor: 'rgba(255, 68, 68, 0.05)',
                      border: '1px solid #ff4444' 
                    }}
                  >
                    <p style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      Detratores
                    </p>
                    <p 
                      className="text-3xl font-bold"
                      style={{ color: '#ff4444' }}
                    >
                      {analytics.npsDistribution.detractors}
                    </p>
                    <p style={{ color: '#666666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Notas 0-6
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && analytics?.totalFeedbacks === 0 && (
          <div 
            className="p-12 text-center"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <BarChart3 size={64} style={{ color: '#333333', margin: '0 auto 1.5rem' }} />
            <h2 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>
              Sem dados ainda
            </h2>
            <p style={{ color: '#888888', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
              Você ainda não recebeu nenhum feedback. 
              Assim que seus usuários começarem a enviar feedbacks, 
              as métricas aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
