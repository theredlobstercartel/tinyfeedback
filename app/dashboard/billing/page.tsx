'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Loader2,
  Shield,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { Subscription, CancelSubscriptionResponse } from '@/types';

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSubscription = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar assinatura');
      }

      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const getUserAndSubscription = async () => {
      const supabase = createClient();
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        window.location.href = '/login';
        return;
      }

      setUser(currentUser);
      
      // Get session for access token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetchSubscription(session.access_token);
      } else {
        setIsLoading(false);
        setError('Sessão expirada');
      }
    };

    getUserAndSubscription();
  }, [fetchSubscription]);

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sessão expirada');
      }

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data: CancelSubscriptionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar assinatura');
      }

      // Update local subscription state
      if (subscription) {
        setSubscription({
          ...subscription,
          cancelAtPeriodEnd: true,
        });
      }

      setSuccessMessage(data.message);
      setShowCancelConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar assinatura');
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(amount / 100);
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 transition-colors"
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
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 
                className="text-2xl font-bold neon-text"
                style={{ color: '#00ff88' }}
              >
                Billing
              </h1>
              <p style={{ color: '#888888' }}>
                Gerencie sua assinatura
              </p>
            </div>
          </div>

          <div className="text-right">
            <p style={{ color: '#ffffff' }}>
              {user?.email}
            </p>
            <p style={{ color: '#888888', fontSize: '0.875rem' }}>
              Founder Pro
            </p>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div 
            className="flex items-center gap-2 p-4"
            style={{
              backgroundColor: '#ff444420',
              border: '1px solid #ff4444',
              color: '#ff4444',
            }}
          >
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div 
            className="flex items-center gap-2 p-4"
            style={{
              backgroundColor: '#00ff8820',
              border: '1px solid #00ff88',
              color: '#00ff88',
            }}
          >
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Subscription Card */}
        {subscription && (
          <div 
            className="p-6 space-y-6"
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #222222',
            }}
          >
            {/* Plan Header */}
            <div className="flex items-center gap-3 pb-6 border-b" style={{ borderColor: '#222222' }}>
              <Package size={24} style={{ color: '#00ff88' }} />
              <div>
                <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
                  Plano {subscription.planName}
                </h2>                
                <div className="flex items-center gap-2 mt-1">
                  {subscription.status === 'active' && !subscription.cancelAtPeriodEnd ? (
                    <span 
                      className="flex items-center gap-1 text-sm"
                      style={{ color: '#00ff88' }}
                    >
                      <CheckCircle size={14} />
                      Ativo
                    </span>
                  ) : subscription.cancelAtPeriodEnd ? (
                    <span 
                      className="flex items-center gap-1 text-sm"
                      style={{ color: '#ffaa00' }}
                    >
                      <AlertTriangle size={14} />
                      Cancelado (vigente até o fim do período)
                    </span>
                  ) : (
                    <span 
                      className="flex items-center gap-1 text-sm"
                      style={{ color: '#ff4444' }}
                    >
                      <XCircle size={14} />
                      {subscription.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span 
                className="text-4xl font-bold"
                style={{ color: '#ffffff' }}
              >
                {subscription.amount === 0 
                  ? 'Grátis' 
                  : formatCurrency(subscription.amount, subscription.currency)}
              </span>
              {subscription.amount > 0 && (
                <span style={{ color: '#888888' }}>
                  /{subscription.interval === 'month' ? 'mês' : 'ano'}
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="p-4 space-y-2"
                style={{
                  backgroundColor: '#000000',
                  border: '1px solid #222222',
                }}
              >
                <div className="flex items-center gap-2" style={{ color: '#888888' }}>
                  <Calendar size={16} />
                  <span className="text-sm">Próxima cobrança</span>
                </div>
                <p style={{ color: '#ffffff' }}>
                  {subscription.cancelAtPeriodEnd 
                    ? 'Não há - assinatura cancelada'
                    : formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>

              <div 
                className="p-4 space-y-2"
                style={{
                  backgroundColor: '#000000',
                  border: '1px solid #222222',
                }}
              >
                <div className="flex items-center gap-2" style={{ color: '#888888' }}>
                  <CreditCard size={16} />
                  <span className="text-sm">Método de pagamento</span>
                </div>
                <p style={{ color: '#ffffff' }}>
                  Stripe
                </p>
              </div>
            </div>

            {/* Access Until */}
            {subscription.cancelAtPeriodEnd && (
              <div 
                className="p-4"
                style={{
                  backgroundColor: '#ffaa0020',
                  border: '1px solid #ffaa00',
                  color: '#ffaa00',
                }}
              >
                <p className="flex items-center gap-2">
                  <Shield size={18} />
                  <span>
                    Você mantém o acesso Pro até <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
                  </span>
                </p>
              </div>
            )}

            {/* Cancel Button */}
            {!subscription.cancelAtPeriodEnd && subscription.amount > 0 && (
              <div className="pt-4 border-t" style={{ borderColor: '#222222' }}>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-6 py-3 font-medium transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ff4444',
                      border: '1px solid #ff4444',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff444420';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Cancelar assinatura
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p style={{ color: '#ff4444' }}>
                      <AlertTriangle size={16} className="inline mr-2" />
                      Tem certeza? Você perderá o acesso aos recursos Pro após o fim do período atual.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                        className="px-6 py-3 font-medium transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: '#ff4444',
                          color: '#ffffff',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCanceling) {
                            e.currentTarget.style.backgroundColor = '#ff6666';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ff4444';
                        }}
                      >
                        {isCanceling ? (
                          <span className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Cancelando...
                          </span>
                        ) : (
                          'Sim, cancelar assinatura'
                        )}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCanceling}
                        className="px-6 py-3 font-medium transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#888888',
                          border: '1px solid #444444',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCanceling) {
                            e.currentTarget.style.borderColor = '#ffffff';
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#444444';
                          e.currentTarget.style.color = '#888888';
                        }}
                      >
                        Manter assinatura
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Subscription State */}
        {!subscription && !isLoading && !error && (
          <div 
            className="p-8 text-center"
            style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #222222',
            }}
          >
            <Package size={48} className="mx-auto mb-4" style={{ color: '#333333' }} />
            <h3 style={{ color: '#ffffff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Nenhuma assinatura encontrada
            </h3>
            <p style={{ color: '#888888' }}>
              Você está usando o plano Free.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
