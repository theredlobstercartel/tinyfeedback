'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, Sparkles } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setError('Sessão de checkout não encontrada');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao verificar pagamento');
        }

        setIsSuccess(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#000000' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#00ff88' }} />
        <p style={{ color: '#888888' }}>Confirmando seu pagamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#000000' }}>
        <div 
          className="p-6 text-center max-w-md"
          style={{ 
            backgroundColor: 'rgba(255, 68, 68, 0.1)', 
            border: '1px solid #ff4444',
          }}
        >
          <h2 style={{ color: '#ff4444', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#888888', marginBottom: '1.5rem' }}>{error}</p>
          <a
            href="/upgrade"
            className="inline-block px-6 py-3 font-medium"
            style={{
              backgroundColor: 'transparent',
              color: '#ff4444',
              border: '1px solid #ff4444',
            }}
          >
            Tentar novamente
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#000000' }}>
      <div 
        className="max-w-md w-full p-8 text-center space-y-6"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #00ff88',
          boxShadow: '0 0 40px rgba(0, 255, 136, 0.15)',
        }}
      >
        {/* Success Icon */}
        <div 
          className="w-20 h-20 mx-auto flex items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(0, 255, 136, 0.1)', 
            border: '2px solid #00ff88',
            borderRadius: '50%',
          }}
        >
          <Check size={40} style={{ color: '#00ff88' }} />
        </div>

        <div className="space-y-2">
          <h1 
            className="text-3xl font-bold"
            style={{ color: '#00ff88' }}
          >
            <Sparkles size={28} className="inline mr-2" />
            Parabéns!
          </h1>
          <p style={{ color: '#888888', fontSize: '1.125rem' }}>
            Você agora é um membro Pro do TinyFeedback
          </p>
        </div>

        <div 
          className="p-4 text-left space-y-2"
          style={{ 
            backgroundColor: 'rgba(0, 255, 136, 0.05)', 
            border: '1px solid rgba(0, 255, 136, 0.2)',
          }}
        >
          <p style={{ color: '#ffffff', fontWeight: 600 }}>O que mudou:</p>
          <ul className="space-y-1" style={{ color: '#888888' }}>
            <li className="flex items-center gap-2">
              <Check size={16} style={{ color: '#00ff88' }} />
              Feedbacks ilimitados
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} style={{ color: '#00ff88' }} />
              Projetos ilimitados
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} style={{ color: '#00ff88' }} />
              Suporte prioritário
            </li>
          </ul>
        </div>

        <a
          href="/dashboard"
          className="block w-full py-3 font-medium transition-colors"
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
          Ir para Dashboard
        </a>

        <p style={{ color: '#666666', fontSize: '0.875rem' }}>
          Um email de confirmação foi enviado para você.
        </p>
      </div>
    </div>
  );
}
