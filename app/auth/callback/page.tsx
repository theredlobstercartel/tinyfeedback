'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, Mail } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        
        // Get the current session - Supabase handles the OTP hash automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
          router.refresh();
        } else {
          // Check if there's an error in the URL hash
          const hash = window.location.hash;
          if (hash.includes('error')) {
            const params = new URLSearchParams(hash.substring(1));
            const errorCode = params.get('error');
            const errorDescription = params.get('error_description');
            
            if (errorCode === 'access_denied' || errorDescription?.includes('expired')) {
              setError('link_expired');
            } else {
              setError(errorDescription || 'Erro desconhecido');
            }
          } else {
            // No session and no error - might be a direct visit
            setError('invalid_link');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('process_error');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div 
          className="w-full max-w-md p-8 text-center space-y-4"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <Loader2 size={48} className="animate-spin mx-auto" style={{ color: '#00ff88' }} />
          <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
            Autenticando...
          </h2>
          <p style={{ color: '#888888' }}>
            Aguarde enquanto verificamos seu link.
          </p>
        </div>
      </div>
    );
  }

  // Link Expired Error
  if (error === 'link_expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div 
          className="w-full max-w-md p-8 space-y-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle size={48} style={{ color: '#ff4444' }} />
            </div>
            <div className="space-y-2">
              <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
                Link expirado
              </h2>
              <p style={{ color: '#888888' }}>
                Este link mágico expirou. Links são válidos por 1 hora por segurança.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="/login"
              className="w-full py-3 font-medium flex items-center justify-center gap-2 transition-colors block text-center"
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
              <Mail size={18} />
              Solicitar novo link
            </a>
            <p 
              className="text-center text-sm"
              style={{ color: '#666666' }}
            >
              Você pode solicitar um novo link a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid Link Error
  if (error === 'invalid_link') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div 
          className="w-full max-w-md p-8 space-y-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle size={48} style={{ color: '#ff4444' }} />
            </div>
            <div className="space-y-2">
              <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
                Link inválido
              </h2>
              <p style={{ color: '#888888' }}>
                Este link não é válido ou já foi usado.
              </p>
            </div>
          </div>

          <a
            href="/login"
            className="w-full py-3 font-medium flex items-center justify-center gap-2 transition-colors block text-center"
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
            Voltar para login
          </a>
        </div>
      </div>
    );
  }

  // Generic Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div 
          className="w-full max-w-md p-8 space-y-6"
          style={{ 
            backgroundColor: '#0a0a0a', 
            border: '1px solid #222222' 
          }}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle size={48} style={{ color: '#ff4444' }} />
            </div>
            <div className="space-y-2">
              <h2 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 600 }}>
                Erro na autenticação
              </h2>
              <p style={{ color: '#888888' }}>
                Ocorreu um erro ao processar seu login. Tente novamente.
              </p>
            </div>
          </div>

          <a
            href="/login"
            className="w-full py-3 font-medium flex items-center justify-center gap-2 transition-colors block text-center"
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
            Voltar para login
          </a>
        </div>
      </div>
    );
  }

  return null;
}
