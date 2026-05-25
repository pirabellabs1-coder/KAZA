import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for use in browser/client components.
 *
 * This client uses the anon key and respects RLS policies.
 * Safe to use in any 'use client' component.
 *
 * Usage:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('properties').select('*')
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
