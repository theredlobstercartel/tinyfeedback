import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export interface SignupCredentials {
  email: string;
  password: string;
}

export interface SignupResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
}

// Client-side signup using the API route
export async function signup(credentials: SignupCredentials): Promise<SignupResult> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erro ao criar conta',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.',
    };
  }
}

// Client-side login
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const supabase = createBrowserClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Erro ao fazer login',
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Erro de conexão. Tente novamente.',
    };
  }
}

// Server-side: Check if email already exists
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking email:', error);
    }

    return !!data;
  } catch {
    return false;
  }
}

// Logout
export async function logout(): Promise<void> {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}
