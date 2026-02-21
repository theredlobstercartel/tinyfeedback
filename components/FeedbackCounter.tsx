'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Sparkles, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types';

interface FeedbackCounterProps {
  projectId: string;
  isPro: boolean;
}

const FREE_PLAN_LIMIT = 100;
const WARNING_THRESHOLD = 80;

export function FeedbackCounter({ projectId, isPro }: FeedbackCounterProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadProjectData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`project_usage_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          if (payload.new) {
            setProject(payload.new as Project);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  async function loadProjectData() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error loading project data:', error);
        return;
      }

      setProject(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Don't show for Pro users
  if (isPro) {
    return (
      <div 
        className="p-6"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222' 
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={18} style={{ color: '#00ff88' }} />
          <h3 style={{ color: '#888888', fontSize: '0.875rem' }}>
            Feedbacks Este Mês
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} style={{ color: '#00ff88' }} />
          <span style={{ color: '#00ff88', fontWeight: 500 }}>
            Ilimitados (Plano Pro)
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        className="p-6 animate-pulse"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222' 
        }}
      >
        <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-zinc-800 rounded w-1/3"></div>
      </div>
    );
  }

  const count = project?.feedbacks_count || 0;
  const max = project?.max_feedbacks || FREE_PLAN_LIMIT;
  const percentage = Math.min((count / max) * 100, 100);
  
  // Determine status
  const isExceeded = count >= max;
  const isWarning = count >= WARNING_THRESHOLD && !isExceeded;
  
  // Get colors based on status
  const getStatusColor = () => {
    if (isExceeded) return '#ff4444';
    if (isWarning) return '#ffaa00';
    return '#00ff88';
  };

  const statusColor = getStatusColor();

  return (
    <div 
      className="p-6 space-y-4"
      style={{ 
        backgroundColor: '#0a0a0a', 
        border: isExceeded ? '1px solid #ff4444' : isWarning ? '1px solid #ffaa00' : '1px solid #222222'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} style={{ color: statusColor }} />
          <h3 style={{ color: '#888888', fontSize: '0.875rem' }}>
            Feedbacks Este Mês
          </h3>
        </div>
        {isWarning && !isExceeded && (
          <AlertTriangle size={18} style={{ color: '#ffaa00' }} />
        )}
        {isExceeded && (
          <XCircle size={18} style={{ color: '#ff4444' }} />
        )}
      </div>
      
      {/* Counter */}
      <div className="flex items-baseline gap-2">
        <span 
          className="text-3xl font-bold"
          style={{ color: statusColor }}
        >
          {count}
        </span>
        <span style={{ color: '#888888' }}>
          de {max}
        </span>
      </div>

      {/* Progress bar */}
      <div 
        className="h-2 w-full"
        style={{ backgroundColor: '#222222' }}
      >
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: statusColor
          }}
        />
      </div>

      <p style={{ color: '#666666', fontSize: '0.75rem' }}>
        {percentage.toFixed(0)}% utilizado
      </p>

      {/* Status message */}
      {isExceeded ? (
        <div 
          className="p-3 space-y-2"
          style={{ 
            backgroundColor: 'rgba(255, 68, 68, 0.1)', 
            border: '1px solid #ff4444'
          }}
        >
          <p style={{ color: '#ff4444', fontWeight: 600, fontSize: '0.875rem' }}>
            Limite atingido!
          </p>
          <p style={{ color: '#ff8888', fontSize: '0.875rem' }}>
            Você atingiu o limite de {max} feedbacks do plano Free.
          </p>
          <a 
            href="/upgrade" 
            className="inline-flex items-center gap-2 px-4 py-2 font-medium transition-colors"
            style={{ 
              backgroundColor: '#ffd700',
              color: '#000000'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffea00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffd700';
            }}
          >
            <Sparkles size={16} />
            Upgrade para Pro
          </a>
        </div>
      ) : isWarning ? (
        <div 
          className="p-3"
          style={{ 
            backgroundColor: 'rgba(255, 170, 0, 0.1)', 
            border: '1px solid #ffaa00'
          }}
        >
          <p style={{ color: '#ffaa00', fontWeight: 600, fontSize: '0.875rem' }}>
            Quase no limite!
          </p>
          <p style={{ color: '#ffcc66', fontSize: '0.875rem' }}>
            Você tem apenas {max - count} feedbacks restantes este mês.
          </p>
        </div>
      ) : (
        <p style={{ color: '#888888', fontSize: '0.875rem' }}>
          {max - count} feedbacks restantes este mês
        </p>
      )}
    </div>
  );
}
