import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session on every request via Next.js middleware.
 *
 * This function:
 * 1. Reads the session cookies from the incoming request
 * 2. Calls supabase.auth.getUser() to validate and refresh the session
 * 3. Writes any updated session cookies to the response
 *
 * Without this, the user's session would expire after the default JWT lifetime
 * and they would be logged out unexpectedly.
 *
 * Usage in middleware.ts:
 *   import { updateSession } from '@/lib/supabase/middleware'
 *   export async function middleware(request: NextRequest) {
 *     return await updateSession(request)
 *   }
 */
export async function updateSession(request: NextRequest) {
  // Start with a basic response that passes through the request
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // Recreate the response to include the updated request cookies
          supabaseResponse = NextResponse.next({
            request,
          })

          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use supabase.auth.getSession() here.
  // getSession() reads from storage (cookies) without validating the JWT.
  // getUser() sends a request to the Supabase Auth server to validate
  // and refresh the session, which is what we need in middleware.
  //
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getUser()

  return supabaseResponse
}
