import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase admin client using the service role key.
 *
 * WARNING: This client bypasses ALL Row Level Security policies.
 * It should ONLY be used in:
 *   - Webhook handlers (e.g. payment callbacks from FedaPay/KKiaPay)
 *   - Scheduled jobs / cron functions
 *   - Server-side operations that require elevated privileges
 *
 * NEVER expose this client or the service role key to the browser.
 * NEVER import this module in client components.
 *
 * Usage:
 *   const supabase = createAdminClient()
 *   const { data } = await supabase.from('users').update({ is_verified: true })
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
      'Ensure they are set in your .env.local file.'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
