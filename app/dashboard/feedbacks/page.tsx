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
  MessageSquare, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Project, Feedback } from '@/types';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { FeedbackDetail } from '@/components/feedback/FeedbackDetail';
import { FeedbackFilterPanel, FeedbackFilters, defaultFilters } from '@/components/feedback/FeedbackFilterPanel';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function FeedbacksPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedbackFilters>(defaultFilters);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

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

  // Load feedbacks
  const loadFeedbacks = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!project?.id) return;

    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        project_id: project.id,
        page: page.toString(),
        limit: '20',
        sort: filters.sort,
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.npsMin) params.append('nps_min', filters.npsMin);
      if (filters.npsMax) params.append('nps_max', filters.npsMax);

      const response = await fetch(`/api/feedbacks?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }

      const result = await response.json();
      
      if (append) {
        setFeedbacks(prev => [...prev, ...result.data]);
      } else {
        setFeedbacks(result.data);
      }
      
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [project?.id, filters]);

  // Load feedbacks when project or filters change
  useEffect(() => {
    if (project?.id) {
      loadFeedbacks(1, false);
    }
  }, [project?.id, filters, loadFeedbacks]);

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      loadFeedbacks(pagination.page + 1, true);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleFeedbackClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleCloseDetail = () => {
    setSelectedFeedback(null);
  };

  const handleUpdateFeedback = (updatedFeedback: Feedback) => {
    setFeedbacks(prev => 
      prev.map(f => f.id === updatedFeedback.id ? updatedFeedback : f)
    );
    setSelectedFeedback(updatedFeedback);
  };

  const isPro = project?.plan === 'pro' && project?.subscription_status === 'active';

  if (isLoading && feedbacks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#00ff88' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-6xl mx-auto space-y-6">
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
                Feedbacks
              </h1>
              <p style={{ color: '#888888' }}>
                Gerencie todos os feedbacks recebidos
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            className="p-4"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <h3 style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Total de Feedbacks
            </h3>
            <p 
              className="text-2xl font-bold"
              style={{ color: '#00ff88' }}
            >
              {pagination.total}
            </p>
          </div>

          <div 
            className="p-4"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <h3 style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Novos
            </h3>
            <p 
              className="text-2xl font-bold"
              style={{ color: '#00d4ff' }}
            >
              {feedbacks.filter(f => f.status === 'new').length}
            </p>
          </div>

          <div 
            className="p-4"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <h3 style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Página Atual
            </h3>
            <p 
              className="text-2xl font-bold"
              style={{ color: '#ffffff' }}
            >
              {pagination.page} / {pagination.totalPages || 1}
            </p>
          </div>

          <div 
            className="p-4"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <h3 style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Mostrando
            </h3>
            <p 
              className="text-2xl font-bold"
              style={{ color: '#ffd700' }}
            >
              {feedbacks.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <FeedbackFilterPanel
          filters={filters}
          onChange={setFilters}
          onClear={handleClearFilters}
        />

        {/* Error */}
        {error && (
          <div 
            className="p-4 flex items-center gap-3"
            style={{ 
              backgroundColor: 'rgba(255, 68, 68, 0.1)', 
              border: '1px solid #ff4444',
              color: '#ff4444'
            }}
          >
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Feedbacks List */}
        <div className="space-y-4">
          {feedbacks.length === 0 && !isLoading ? (
            <div 
              className="p-12 text-center"
              style={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #222222' 
              }}
            >
              <MessageSquare size={48} style={{ color: '#333333', margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Nenhum feedback encontrado
              </h3>
              <p style={{ color: '#888888' }}>
                {pagination.total === 0 
                  ? 'Você ainda não recebeu nenhum feedback.' 
                  : 'Nenhum feedback corresponde aos filtros selecionados.'}
              </p>
            </div>
          ) : (
            <>
              {feedbacks.map((feedback) => (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  onClick={() => handleFeedbackClick(feedback)}
                />
              ))}

              {/* Load More */}
              {pagination.hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 px-6 py-3 font-medium transition-colors"
                    style={{
                      backgroundColor: isLoadingMore ? '#1a1a1a' : 'transparent',
                      color: '#00ff88',
                      border: '1px solid #00ff88',
                      opacity: isLoadingMore ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingMore) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isLoadingMore ? '#1a1a1a' : 'transparent';
                    }}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <ChevronDown size={18} />
                        Carregar mais ({pagination.total - feedbacks.length} restantes)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* End of list */}
              {!pagination.hasMore && feedbacks.length > 0 && (
                <div 
                  className="text-center py-8"
                  style={{ color: '#666666' }}
                >
                  <ChevronUp size={20} style={{ margin: '0 auto 0.5rem' }} />
                  <p>Fim da lista</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetail
          feedback={selectedFeedback}
          onClose={handleCloseDetail}
          onUpdate={handleUpdateFeedback}
        />
      )}
    </div>
  );
}
