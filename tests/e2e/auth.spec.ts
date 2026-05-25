import { expect, test } from '@playwright/test';

import { acceptCookies, isSupabaseConfigured } from './fixtures';

/**
 * Tests E2E — Parcours d'authentification (`/login`, `/signup`).
 *
 * Vérifie la présence des champs et liens critiques sans valider le flux
 * complet (qui nécessite Supabase live).
 */
test.describe('Authentification', () => {
  test('/login affiche email, password, bouton, lien signup et forgot-password', async ({
    page,
  }) => {
    await page.goto('/login');
    await acceptCookies(page);

    // Heading
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();

    // Champs
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();

    // Bouton submit
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();

    // Liens
    await expect(page.getByRole('link', { name: /Mot de passe oublie/i })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
    await expect(page.getByRole('link', { name: /Creer un compte/i })).toHaveAttribute(
      'href',
      '/signup',
    );
  });

  test('/signup affiche tous les champs requis et le sélecteur de rôle', async ({ page }) => {
    await page.goto('/signup');
    await acceptCookies(page);

    await expect(page.getByRole('heading', { name: 'Creer un compte' })).toBeVisible();

    // Sélecteur de rôle (3 boutons : OWNER, TENANT, STUDENT)
    await expect(page.getByRole('button', { name: /Proprietaire/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Locataire/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Etudiant/i })).toBeVisible();

    // Champs identité + contact
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#lastName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();

    // Bouton submit
    await expect(page.getByRole('button', { name: /Creer mon compte/i })).toBeVisible();
  });

  test('accès à /owner/properties sans login redirige vers /login (ou affiche login)', async ({
    page,
  }) => {
    test.skip(
      !isSupabaseConfigured(),
      'Supabase non configuré — middleware ne peut pas valider la session, test sauté.',
    );

    await page.goto('/owner/properties');

    // Le middleware doit rediriger vers /login?redirect=/owner/properties
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe('/owner/properties');

    // La page de connexion doit s'afficher correctement
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  });
});
