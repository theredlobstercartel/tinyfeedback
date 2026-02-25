/**
 * Supabase Server Client
 * Server-side Supabase client for API routes and server components
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export function createServerClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
