import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using SERVICE_ROLE_KEY.
 * NEVER import this in client components or expose to the browser.
 * Use only in Route Handlers and server-side code for financial operations.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}
