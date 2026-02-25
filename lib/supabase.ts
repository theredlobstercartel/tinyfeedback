import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para uso no browser
 * Utiliza as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Exporta o tipo do cliente para uso em tipagens
export type SupabaseClient = ReturnType<typeof createClient>;
