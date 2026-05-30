// =============================================================================
// KAZA - Demo Mode helpers (server-side)
//
// Quand aucun Supabase n'est branché, les server actions doivent retomber
// gracieusement sur des réponses "mock success" plutôt que de planter avec
// `fetch failed`. Ce helper centralise la détection du mode démo.
// =============================================================================

export function isDemoMode(): boolean {
  // Sécurité : JAMAIS de mode démo en production. Si la config Supabase venait
  // à manquer en prod, on ne doit pas retourner de faux succès silencieux —
  // mieux vaut une vraie erreur qu'une visite/contrat fantôme non persisté.
  if (process.env.NODE_ENV === "production") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return !url || url.includes("placeholder") || url.includes("example");
}

export type DemoActionResult<T = unknown> =
  | { success: true; demo?: boolean; data?: T; message?: string }
  | { success: false; error: string };

/**
 * Retourne un résultat de succès en mode démo. À utiliser comme premier check
 * dans une server action :
 *
 *     if (isDemoMode()) return demoOk({ message: "Visite confirmée (démo)." });
 */
export function demoOk<T = undefined>(
  opts: { data?: T; message?: string } = {},
): DemoActionResult<T> {
  return {
    success: true,
    demo: true,
    ...(opts.data !== undefined ? { data: opts.data } : {}),
    ...(opts.message !== undefined ? { message: opts.message } : {}),
  };
}
