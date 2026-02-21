'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogOut, Loader2, ArrowLeft, Settings } from 'lucide-react';
import { InstallationCode, DomainManager } from '@/components/settings';
import { Project } from '@/types';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch user's project
          const { data: projects, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .limit(1);

          if (projectError) {
            throw projectError;
          }

          if (projects && projects.length > 0) {
            setProject(projects[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar configurações. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

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
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="p-2 transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: '#888888',
                border: '1px solid #333333',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff88';
                e.currentTarget.style.color = '#00ff88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333333';
                e.currentTarget.style.color = '#888888';
              }}
            >
              <ArrowLeft size={20} />
            </a>
            <div>
              <h1 
                className="text-2xl font-bold neon-text"
                style={{ color: '#00ff88' }}
              >
                TinyFeedback
              </h1>
              <p style={{ color: '#888888' }}>
                Configurações
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p style={{ color: '#ffffff' }}>
                {user?.email}
              </p>
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                Founder
              </p>
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

        {/* Page Title */}
        <section 
          className="p-8"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="flex items-center gap-3">
            <Settings size={32} style={{ color: '#00ff88' }} />
            <div>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 600 }}>
                Configurações do Projeto
              </h2>
              <p style={{ color: '#888888', marginTop: '0.5rem' }}>
                Gerencie a instalação do widget e domínios permitidos
              </p>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div 
            className="p-4 text-center"
            style={{ 
              backgroundColor: '#ff444420', 
              border: '1px solid #ff4444',
              color: '#ff4444'
            }}
          >
            {error}
          </div>
        )}

        {/* Content */}
        {project ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Installation Code */}
            <InstallationCode apiKey={project.api_key} />

            {/* Domain Manager */}
            <DomainManager 
              projectId={project.id} 
              initialDomains={project.allowed_domains || []} 
            />
          </div>
        ) : (
          <div 
            className="p-8 text-center"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid #222222',
              color: '#888888'
            }}
          >
            <Settings size={48} className="mx-auto mb-4" style={{ color: '#333333' }} />
            <p>Nenhum projeto encontrado</p>
            <p className="text-sm mt-2" style={{ color: '#666666' }}>
              Crie um projeto primeiro para ver as configurações de instalação
            </p>
          </div>
        )}

        {/* Project Info */}
        {project && (
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
              Projeto: <strong>{project.name}</strong> • API Key configurada
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
