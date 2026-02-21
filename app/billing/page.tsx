'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types';

export default function BillingPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadProject();
  }, []);

  async function loadProject() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (project) {
        setProject(project);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  const isPro = project?.plan === 'pro' && project?.subscription_status === 'active';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Planos e Preços</h1>
        <p className="text-zinc-600">
          Escolha o plano ideal para o seu produto
        </p>
      </div>

      {isPro && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-none">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">
              Você está no plano Pro! Aproveite feedbacks ilimitados.
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className={`border-2 p-8 ${isPro ? 'border-zinc-200 opacity-75' : 'border-zinc-900'}`}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Free</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-zinc-900">R$ 0</span>
              <span className="text-zinc-500">/mês</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Até 100 feedbacks por mês</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Widget personalizável</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Dashboard básico</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Suporte por email</span>
            </li>
            <li className="flex items-start gap-3 opacity-50">
              <X className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
              <span className="text-zinc-500">Analytics avançado</span>
            </li>
            <li className="flex items-start gap-3 opacity-50">
              <X className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
              <span className="text-zinc-500">Notificações em tempo real</span>
            </li>
          </ul>

          <button
            disabled={!isPro}
            className={`w-full py-3 px-4 font-medium border-2 transition-colors ${
              isPro
                ? 'border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white'
                : 'border-zinc-300 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isPro ? 'Fazer Downgrade' : 'Plano Atual'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`border-2 p-8 relative ${isPro ? 'border-emerald-500' : 'border-zinc-900'}`}>
          {!isPro && (
            <div className="absolute -top-3 left-4 bg-zinc-900 text-white px-3 py-1 text-sm font-medium">
              Recomendado
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Pro</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-zinc-900">R$ 29</span>
              <span className="text-zinc-500">/mês</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700 font-medium">Feedbacks ilimitados</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Widget personalizável</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Dashboard completo</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Analytics avançado</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Notificações em tempo real</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-zinc-700">Suporte prioritário</span>
            </li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={checkoutLoading || isPro}
            className={`w-full py-3 px-4 font-medium border-2 transition-colors flex items-center justify-center gap-2 ${
              isPro
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 cursor-default'
                : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : isPro ? (
              <>
                <Sparkles className="w-4 h-4" />
                Plano Ativo
              </>
            ) : (
              'Upgrade para Pro'
            )}
          </button>
        </div>
      </div>

      {project?.subscription_period_end && isPro && (
        <div className="mt-8 p-4 bg-zinc-50 border border-zinc-200">
          <p className="text-sm text-zinc-600">
            <strong>Próxima cobrança:</strong>{' '}
            {new Date(project.subscription_period_end).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
}
