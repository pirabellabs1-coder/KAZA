import { expect, type Page } from '@playwright/test';

/**
 * Helpers communs aux tests E2E KAZA.
 *
 * Tous les sélecteurs et données mock partagés vivent ici pour rester
 * cohérents entre specs.
 */

/**
 * Sélecteurs réutilisables (data-testid absents pour le MVP — on cible
 * via rôle/texte conformément aux bonnes pratiques Playwright).
 */
export const selectors = {
  cookieBanner: '[role="dialog"][aria-labelledby="cookie-title"]',
  acceptAllCookies: 'button:has-text("Tout accepter")',
  // PropertyCard est un <a href="/properties/[id]"> englobant l'image.
  propertyCardLink: 'a[href^="/properties/"]',
  // PropertySearchBar (hero) — champ localisation.
  heroLocationInput: 'input[placeholder*="Cotonou"]',
  compactSearchInput: 'input[placeholder*="Rechercher un lieu"]',
  searchSubmit: 'button:has-text("Rechercher")',
} as const;

/**
 * Accepte le bandeau cookies s'il est visible. No-op sinon (deuxième visite).
 *
 * Le bandeau persiste via localStorage (clé `kaza-cookie-consent`). Comme
 * chaque test démarre dans un contexte vierge, le bandeau apparait
 * systématiquement au premier passage.
 */
export async function acceptCookies(page: Page): Promise<void> {
  const banner = page.locator(selectors.cookieBanner);
  if (await banner.isVisible().catch(() => false)) {
    await page.locator(selectors.acceptAllCookies).click();
    await expect(banner).toBeHidden();
  }
}

/**
 * Indique si l'environnement dispose d'une configuration Supabase exploitable.
 * Sert à skip les tests qui requièrent un backend live.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Valeurs mock partagées pour les formulaires d'inscription.
 * Email randomisé pour éviter les collisions si jamais branché live.
 */
export const mockSignupUser = {
  firstName: 'Awa',
  lastName: 'Test',
  email: `awa-test+${Date.now()}@example.com`,
  phone: '+229 97 00 00 00',
  password: 'TestPass!2026',
  confirmPassword: 'TestPass!2026',
  role: 'TENANT' as const,
};
