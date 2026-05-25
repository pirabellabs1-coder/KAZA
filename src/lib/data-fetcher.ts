// =============================================================================
// KAZA - Data Fetcher (Server-only)
//
// Helper qui execute une query Supabase en production et retombe sur le mock
// en dev/CI tant que Supabase n'est pas configure (ou en cas d'erreur reseau).
// Permet aux pages dashboard de fonctionner de maniere identique avec ou sans
// backend, tant que les types de retour sont alignes.
// =============================================================================

import 'server-only';

let supabaseAvailable: boolean | null = null;

/**
 * Verifie (et memoize) la presence des variables d'environnement Supabase.
 * On considere la configuration "manquante" si l'URL contient `example`
 * (placeholder du `.env.example`) afin d'eviter d'appeler un endpoint bidon.
 */
export async function isSupabaseConfigured(): Promise<boolean> {
  if (supabaseAvailable !== null) return supabaseAvailable;
  supabaseAvailable = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('example'),
  );
  return supabaseAvailable;
}

/**
 * Execute la query Supabase, retombe sur le mock en cas d'erreur ou de
 * configuration manquante. Le fallback doit retourner la meme forme de donnees
 * que la query reelle.
 */
export async function fetchWithFallback<T>(
  supabaseQuery: () => Promise<T>,
  mockFallback: () => T | Promise<T>,
): Promise<T> {
  if (!(await isSupabaseConfigured())) {
    return mockFallback();
  }
  try {
    return await supabaseQuery();
  } catch (err) {
    console.warn('[data-fetcher] Supabase query failed, using mock:', err);
    return mockFallback();
  }
}
