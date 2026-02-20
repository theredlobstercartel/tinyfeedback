'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

const RATE_LIMIT_KEY = 'magic_link_requests';
const MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

interface RateLimitEntry {
  count: number;
  timestamp: number;
}

function checkRateLimit(): { allowed: boolean; remaining: number; resetInSeconds: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: MAX_REQUESTS, resetInSeconds: 0 };
  }

  const now = Date.now();
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  let entry: RateLimitEntry = stored ? JSON.parse(stored) : { count: 0, timestamp: now };

  // Reset if window has passed
  if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, timestamp: now };
  }

  const allowed = entry.count < MAX_REQUESTS;
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const resetInSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.timestamp)) / 1000);

  return { allowed, remaining, resetInSeconds };
}

function incrementRateLimit(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  let entry: RateLimitEntry = stored ? JSON.parse(stored) : { count: 0, timestamp: now };

  // Reset if window has passed
  if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, timestamp: now };
  }

  entry.count += 1;
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry));
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; resetInSeconds: number } | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimitInfo(null);

    // Validate email
    if (!email.trim()) {
      setError('Por favor, insira seu email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    // Check rate limit
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setRateLimitInfo({ remaining: 0, resetInSeconds: rateLimit.resetInSeconds });
      setError(`Muitas tentativas. Aguarde ${rateLimit.resetInSeconds} segundos.`);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // Increment rate limit on success
      incrementRateLimit();
      setRateLimitInfo({ 
        remaining: rateLimit.remaining - 1, 
        resetInSeconds: 60 
      });
      setIsSuccess(true);
    } catch (err) {
      console.error('Error sending magic link:', err);
      setError('Erro ao enviar o link. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
      <div 
        className="w-full max-w-md p-8 space-y-6"
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #222222' 
        }}
      >
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <h1 
            className="text-2xl font-bold neon-text"
            style={{ color: '#00ff88' }}
          >
            TinyFeedback
          </h1>
          <p style={{ color: '#888888' }}>
            Entre com seu email
          </p>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle size={48} style={{ color: '#00ff88' }} />
            </div>
            <div className="space-y-2">
              <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
                Verifique seu email
              </h2>
              <p style={{ color: '#888888' }}>
                Enviamos um link mágico para{' '}
                <strong style={{ color: '#ffffff' }}>{email}</strong>
              </p>
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                Clique no link para entrar automaticamente.
                <br />
                O link expira em 1 hora.
              </p>
            </div>
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
                setRateLimitInfo(null);
              }}
              className="w-full py-3 font-medium transition-colors"
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
              Usar outro email
            </button>
            {rateLimitInfo && rateLimitInfo.remaining < MAX_REQUESTS && (
              <p style={{ color: '#888888', fontSize: '0.75rem' }}>
                {rateLimitInfo.remaining} tentativas restantes neste minuto
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium"
                style={{ color: '#888888' }}
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail size={18} style={{ color: '#888888' }} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@startup.com"
                  disabled={isLoading}
                  className="w-full py-3 pl-10 pr-4 transition-colors"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '1px solid #222222',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#00ff88';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#222222';
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 text-sm"
                style={{ 
                  backgroundColor: 'rgba(255, 68, 68, 0.1)', 
                  color: '#ff4444',
                  border: '1px solid #ff4444'
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 font-medium flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: isLoading ? '#1a1a1a' : '#00ff88',
                color: '#000000',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#00ffaa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#00ff88';
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Help Text */}
            <p 
              className="text-center text-sm"
              style={{ color: '#666666' }}
            >
              Não precisa de senha. Usamos links mágicos seguros.
            </p>

            {/* Rate Limit Info */}
            {rateLimitInfo && rateLimitInfo.remaining > 0 && (
              <p 
                className="text-center text-xs"
                style={{ color: '#555555' }}
              >
                {rateLimitInfo.remaining} tentativas restantes
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
