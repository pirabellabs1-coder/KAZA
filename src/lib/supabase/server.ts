import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers within the Next.js App Router.
 *
 * This client reads and writes cookies to maintain the user session.
 * It uses the anon key and respects RLS policies.
 *
 * Must be called within a request context (Server Component, Server Action,
 * or Route Handler) where `cookies()` is available.
 *
 * Usage:
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies cannot be set. This is expected when the middleware
            // has already refreshed the session. No action needed.
          }
        },
      },
    }
  )
}
