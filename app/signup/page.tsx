'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { signup } from '@/lib/supabase/auth';

const RATE_LIMIT_KEY = 'signup_attempts';
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

// Password validation
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos 1 letra maiúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos 1 letra minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos 1 número');
  }

  return { valid: errors.length === 0, errors };
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; resetInSeconds: number } | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const validation = validatePassword(newPassword);
    setPasswordErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimitInfo(null);

    // Validate email
    if (!email.trim()) {
      setError('Por favor, insira seu email');
      toast.error('Por favor, insira seu email', {
        style: {
          background: '#0a0a0a',
          border: '1px solid #ff4444',
          color: '#ff4444',
        },
      });
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido');
      toast.error('Por favor, insira um email válido', {
        style: {
          background: '#0a0a0a',
          border: '1px solid #ff4444',
          color: '#ff4444',
        },
      });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError('A senha não atende aos requisitos');
      toast.error('A senha não atende aos requisitos', {
        style: {
          background: '#0a0a0a',
          border: '1px solid #ff4444',
          color: '#ff4444',
        },
      });
      return;
    }

    // Check rate limit
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      setRateLimitInfo({ remaining: 0, resetInSeconds: rateLimit.resetInSeconds });
      setError(`Muitas tentativas. Aguarde ${rateLimit.resetInSeconds} segundos.`);
      toast.error(`Muitas tentativas. Aguarde ${rateLimit.resetInSeconds} segundos.`, {
        style: {
          background: '#0a0a0a',
          border: '1px solid #ff4444',
          color: '#ff4444',
        },
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({ email, password });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conta');
      }

      // Increment rate limit on success
      incrementRateLimit();
      setRateLimitInfo({ 
        remaining: rateLimit.remaining - 1, 
        resetInSeconds: 60 
      });
      setIsSuccess(true);
      
      // Toast de sucesso
      toast.success('Conta criada com sucesso!', {
        description: 'Verifique seu email para confirmar sua conta.',
        style: {
          background: '#0a0a0a',
          border: '1px solid #00ff88',
          color: '#00ff88',
        },
      });
    } catch (err) {
      console.error('Error signing up:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage, {
        style: {
          background: '#0a0a0a',
          border: '1px solid #ff4444',
          color: '#ff4444',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    router.push('/dashboard');
    router.refresh();
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
            Crie sua conta
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
                Conta criada!
              </h2>
              <p style={{ color: '#888888' }}>
                Enviamos um email de confirmação para{' '}
                <strong style={{ color: '#ffffff' }}>{email}</strong>
              </p>
              <p style={{ color: '#888888', fontSize: '0.875rem' }}>
                Clique no link para ativar sua conta.
                <br />
                O link expira em 1 hora.
              </p>
            </div>
            <button
              onClick={handleContinueToDashboard}
              className="w-full py-3 font-medium transition-colors"
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
              Continuar para o Dashboard
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
                setPassword('');
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
              Criar outra conta
            </button>
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

            {/* Password Input */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium"
                style={{ color: '#888888' }}
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock size={18} style={{ color: '#888888' }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full py-3 pl-10 pr-12 transition-colors"
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#888888' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Requirements */}
              <div className="space-y-1 pt-1">
                <p style={{ color: '#666666', fontSize: '0.75rem' }}>
                  A senha deve ter:
                </p>
                <ul className="space-y-0.5">
                  {[
                    { label: 'Mínimo 8 caracteres', test: password.length >= 8 },
                    { label: 'Pelo menos 1 letra maiúscula', test: /[A-Z]/.test(password) },
                    { label: 'Pelo menos 1 letra minúscula', test: /[a-z]/.test(password) },
                    { label: 'Pelo menos 1 número', test: /[0-9]/.test(password) },
                  ].map((req, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-xs"
                      style={{
                        color: req.test ? '#00ff88' : '#666666',
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: req.test ? '#00ff88' : '#666666',
                        }}
                      />
                      {req.label}
                    </li>
                  ))}
                </ul>
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
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Login Link */}
            <p 
              className="text-center text-sm"
              style={{ color: '#666666' }}
            >
              Já tem uma conta?{' '}
              <a 
                href="/login" 
                style={{ color: '#00ff88' }}
                className="hover:underline"
              >
                Entrar
              </a>
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
