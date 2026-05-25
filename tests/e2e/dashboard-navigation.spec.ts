import { expect, test } from '@playwright/test';

import { isSupabaseConfigured } from './fixtures';

/**
 * Tests E2E — Navigation dans les espaces dashboard.
 *
 * Skip global : sans Supabase configuré, la session ne peut pas être
 * établie, et toutes les routes protégées redirigent vers /login.
 * En version dégradée, on vérifie au minimum que la redirection est
 * propre et n'expose pas de contenu privé.
 */
test.describe('Navigation dashboard', () => {
  test.beforeEach(({}, testInfo) => {
    if (!isSupabaseConfigured()) {
      testInfo.annotations.push({
        type: 'skip-reason',
        description: 'Supabase non configuré — tests dashboard en mode dégradé.',
      });
    }
  });

  test('routes protégées redirigent vers /login en absence de session', async ({ page }) => {
    test.skip(
      !isSupabaseConfigured(),
      'Sans Supabase, le middleware ne s\'exécute pas — comportement non testable de manière fiable.',
    );

    const protectedRoutes = [
      '/owner/properties',
      '/tenant/payments',
      '/student/expenses',
      '/dashboard',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page, `${route} doit rediriger vers /login`).toHaveURL(/\/login/);
    }
  });

  test('navigation sidebar dashboard (skipé en mock-only)', async ({ page }) => {
    // Ce test requiert une session valide injectée via cookie Supabase.
    // En MVP/mock-only, on documente l'intention et on skip proprement.
    test.skip(
      !isSupabaseConfigured() || !process.env.E2E_TEST_USER_TOKEN,
      'Requiert Supabase live + E2E_TEST_USER_TOKEN (cookie de session). Skip en mode mock.',
    );

    // Injection de cookie session (placeholder — à adapter au format Supabase SSR)
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: process.env.E2E_TEST_USER_TOKEN!,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Sidebar — au moins un lien de navigation visible
    const sidebar = page.getByRole('navigation').first();
    await expect(sidebar).toBeVisible();
  });
});
