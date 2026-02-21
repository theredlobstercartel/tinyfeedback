'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Wait a moment for webhook to process
      setTimeout(() => {
        setStatus('success');
      }, 2000);
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-zinc-900 mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900">Processando seu pagamento...</h1>
        <p className="text-zinc-600 mt-2">Aguarde enquanto ativamos seu plano Pro</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl">✕</span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">Algo deu errado</h1>
        <p className="text-zinc-600 mt-2 mb-6">Não conseguimos processar seu pagamento</p>
        <button
          onClick={() => router.push('/billing')}
          className="px-6 py-3 bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
        >
          Voltar para Planos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 bg-emerald-100 flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>
      
      <h1 className="text-2xl font-bold text-zinc-900 text-center">
        Bem-vindo ao Plano Pro! 🎉
      </h1>
      
      <p className="text-zinc-600 mt-4 text-center max-w-md">
        Seu pagamento foi confirmado e seu plano Pro está ativo.
        Agora você tem acesso a feedbacks ilimitados e todos os recursos premium.
      </p>

      <div className="mt-8 space-y-3 w-full max-w-sm">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 px-6 bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
        >
          Ir para Dashboard
        </button>
        
        <button
          onClick={() => router.push('/settings')}
          className="w-full py-3 px-6 border-2 border-zinc-900 text-zinc-900 font-medium hover:bg-zinc-50 transition-colors"
        >
          Configurações
        </button>
      </div>
    </div>
  );
}
