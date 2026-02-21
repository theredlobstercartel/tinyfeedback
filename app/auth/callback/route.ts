import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth Callback Route Handler
 * 
 * Recebe o token do magic link enviado por email e autentica o usuário.
 * O Supabase Auth envia o token como query parameter (code) ou hash fragment.
 * 
 * URL de callback: /auth/callback?code=xxx
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Troca o código por uma sessão
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Autenticação bem-sucedida, redireciona para o dashboard
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    // Se houver erro na troca do código, redireciona para login com erro
    console.error('Error exchanging code for session:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  // Se não houver código, redireciona para login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
