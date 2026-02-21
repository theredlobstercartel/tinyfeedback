'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Check, X, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { PLAN_CONFIG } from '@/lib/stripe';

function UpgradeContent() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');
  
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user's project (for demo, we'll use the first project)
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (projects && projects.length > 0) {
          setProject(projects[0]);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleUpgrade = async () => {
    if (!project || !user?.email) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          userEmail: user.email,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar checkout');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não encontrada');
      }
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#00ff88' }} />
      </div>
    );
  }

  const isPro = project?.plan === 'pro';

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 
            className="text-4xl font-bold neon-text"
            style={{ color: '#00ff88' }}
          >
            Escolha seu Plano
          </h1>
          <p style={{ color: '#888888', fontSize: '1.125rem' }}>
            Faça upgrade para desbloquear recursos ilimitados
          </p>
        </header>

        {/* Canceled Alert */}
        {canceled && (
          <div 
            className="p-4 text-center"
            style={{ 
              backgroundColor: 'rgba(255, 68, 68, 0.1)', 
              border: '1px solid #ff4444',
              color: '#ff4444'
            }}
          >
            Pagamento cancelado. Você pode tentar novamente quando quiser.
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div 
            className="p-4 text-center"
            style={{ 
              backgroundColor: 'rgba(255, 68, 68, 0.1)', 
              border: '1px solid #ff4444',
              color: '#ff4444'
            }}
          >
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div 
            className="p-8 space-y-6"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: isPro ? '1px solid #222222' : '1px solid #00ff88',
            }}
          >
            <div className="space-y-2">
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 600 }}>
                {PLAN_CONFIG.free.name}
              </h2>
              <p style={{ color: '#888888' }}>
                Para começar
              </p>
            </div>

            <div className="py-4">
              <span 
                className="text-4xl font-bold"
                style={{ color: '#ffffff' }}
              >
                Grátis
              </span>
            </div>

            <ul className="space-y-4">
              {PLAN_CONFIG.free.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3" style={{ color: '#888888' }}>
                  <Check size={18} style={{ color: isPro ? '#444444' : '#00ff88' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={true}
              className="w-full py-3 font-medium"
              style={{
                backgroundColor: isPro ? 'transparent' : 'rgba(0, 255, 136, 0.1)',
                color: isPro ? '#444444' : '#00ff88',
                border: `1px solid ${isPro ? '#444444' : '#00ff88'}`,
                cursor: 'not-allowed',
              }}
            >
              {isPro ? 'Plano Atual' : 'Plano Atual'}
            </button>
          </div>

          {/* Pro Plan */}
          <div 
            className="p-8 space-y-6 relative"
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: isPro ? '1px solid #00ff88' : '1px solid #00ff88',
              boxShadow: isPro ? '0 0 30px rgba(0, 255, 136, 0.1)' : 'none',
            }}
          >
            {/* Pro Badge */}
            <div 
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-medium"
              style={{ 
                backgroundColor: '#00ff88', 
                color: '#000000',
              }}
            >
              <Sparkles size={14} className="inline mr-1" />
              RECOMENDADO
            </div>

            <div className="space-y-2">
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 600 }}>
                {PLAN_CONFIG.pro.name}
              </h2>
              <p style={{ color: '#888888' }}>
                Para founders sérios
              </p>
            </div>

            <div className="py-4">
              <span 
                className="text-4xl font-bold"
                style={{ color: '#00ff88' }}
              >
                R$ {PLAN_CONFIG.pro.price}
              </span>
              <span style={{ color: '#888888' }}>/mês</span>
            </div>

            <ul className="space-y-4">
              {PLAN_CONFIG.pro.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3" style={{ color: '#ffffff' }}>
                  <Check size={18} style={{ color: '#00ff88' }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={isProcessing || isPro || !project}
              className="w-full py-3 font-medium flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: isPro ? 'transparent' : '#00ff88',
                color: isPro ? '#00ff88' : '#000000',
                border: '1px solid #00ff88',
                cursor: isPro || !project ? 'not-allowed' : 'pointer',
                opacity: isPro || !project ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isPro && project) {
                  e.currentTarget.style.backgroundColor = '#00ffaa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPro && project) {
                  e.currentTarget.style.backgroundColor = '#00ff88';
                }
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processando...
                </>
              ) : isPro ? (
                'Você já é Pro'
              ) : !project ? (
                'Crie um projeto primeiro'
              ) : (
                <>
                  Upgrade para Pro
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <a
            href="/dashboard"
            style={{ color: '#888888' }}
            className="hover:underline transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00ff88';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888888';
            }}
          >
            ← Voltar para Dashboard
          </a>
        </div>

        {/* Security Note */}
        <div 
          className="p-4 text-center text-sm"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222',
            color: '#666666'
          }}
        >
          Pagamento seguro processado pelo Stripe. Cancele quando quiser.
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#00ff88' }} />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
