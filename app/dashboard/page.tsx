'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogOut, Loader2, Sparkles, MessageSquare, BarChart3 } from 'lucide-react';
import { FeedbackCounter } from '@/components/FeedbackCounter';
import { CreateProjectModal } from '@/components/projects';
import type { Project } from '@/types';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (projects && projects.length > 0) {
          setProject(projects[0]);
          setProjectCount(projects.length);
        }
      }
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleProjectCreated = async () => {
    // Refresh project data after creation
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (projects && projects.length > 0) {
        setProject(projects[0]);
        setProjectCount(projects.length);
      }
    }
  };

  const isPro = project?.plan === 'pro' && project?.subscription_status === 'active';

  if (isLoading) {
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
          <div>
            <h1 
              className="text-2xl font-bold neon-text"
              style={{ color: '#00ff88' }}
            >
              TinyFeedback
            </h1>
            <p style={{ color: '#888888' }}>
              Dashboard
            </p>
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

        {/* Welcome Section */}
        <section 
          className="p-8"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Bem-vindo ao TinyFeedback! 👋
          </h2>
          <p style={{ color: '#888888', lineHeight: 1.6 }}>
            Você está autenticado com sucesso usando Magic Link. 
            Este é o dashboard principal onde você poderá gerenciar seus projetos 
            e visualizar feedbacks dos seus usuários.
          </p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="p-6"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <h3 style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Projetos
            </h3>
            <p 
              className="text-3xl font-bold"
              style={{ color: '#00ff88' }}
            >
              {projectCount}
            </p>
          </div>

          {/* AC-01: Feedback Counter for Free Plan */}
          {project && (
            <FeedbackCounter 
              projectId={project.id} 
              isPro={isPro} 
            />
          )}

          <div 
            className="p-6"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222' 
            }}
          >
            <h3 style={{ color: '#888888', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              NPS Médio
            </h3>
            <p 
              className="text-3xl font-bold"
              style={{ color: '#ffffff' }}
            >
              -
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <section 
          className="p-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <h3 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
            Ações Rápidas
          </h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="/dashboard/feedbacks"
              className="px-6 py-3 font-medium transition-colors inline-flex items-center gap-2"
              style={{
                backgroundColor: '#00ff88',
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ffaa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff88';
              }}
            >
              <MessageSquare size={18} />
              Ver Feedbacks
            </a>

            <a
              href="/dashboard/analytics"
              className="px-6 py-3 font-medium transition-colors inline-flex items-center gap-2"
              style={{
                backgroundColor: 'transparent',
                color: '#00d4ff',
                border: '1px solid #00d4ff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <BarChart3 size={18} />
              Analytics
            </a>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                color: '#00ff88',
                border: '1px solid #00ff88',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Criar Projeto
            </button>
            
            {!isPro && (
              <a
                href="/billing"
                className="px-6 py-3 font-medium transition-colors inline-flex items-center gap-2"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffd700',
                  border: '1px solid #ffd700',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Sparkles size={16} />
                Upgrade para Pro
              </a>
            )}
            
            <button
              className="px-6 py-3 font-medium transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#00ff88',
                border: '1px solid #00ff88',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Ver Documentação
            </button>
            <a
              href="/settings"
              className="px-6 py-3 font-medium transition-colors inline-flex items-center"
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
              Configurações
            </a>
          </div>
        </section>

        {/* Auth Status */}
        <div 
          className="p-4 text-sm"
          style={{ 
            backgroundColor: 'rgba(0, 255, 136, 0.05)', 
            border: '1px solid rgba(0, 255, 136, 0.2)',
            color: '#00ff88'
          }}
        >
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ff88' }}></span>
            Autenticado via Magic Link • Sessão ativa
          </p>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
