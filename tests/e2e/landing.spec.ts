import { expect, test } from '@playwright/test';

import { acceptCookies, selectors } from './fixtures';

/**
 * Tests E2E — Landing page (homepage publique `/`).
 *
 * Vérifie la composition de la home : hero, listings featured,
 * sections étudiant et "How Kaza Works", newsletter, ainsi que le
 * comportement du bandeau cookies.
 */
test.describe('Landing page', () => {
  test('affiche tous les blocs principaux de la home', async ({ page }) => {
    await page.goto('/');

    // Hero — titre principal
    const heroTitle = page.locator('h1', { hasText: 'Home in Africa' });
    await expect(heroTitle, 'Le titre du hero doit contenir "Home in Africa"').toBeVisible();

    // Hero — barre de recherche présente
    await expect(page.locator(selectors.heroLocationInput).first()).toBeVisible();

    // Featured Listings — section + au moins 3 cards
    await expect(page.getByRole('heading', { name: 'Featured Listings' })).toBeVisible();
    const cards = page.locator(selectors.propertyCardLink);
    await expect(cards, 'Au moins 3 PropertyCard doivent être affichées').toHaveCount(
      await cards.count(),
    );
    expect(await cards.count(), 'attendu >= 3 propriétés featured').toBeGreaterThanOrEqual(3);

    // Section étudiant — KAZA ACADEMIA
    await expect(page.getByText('KAZA ACADEMIA')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Elite Student Living Across the Continent' }),
    ).toBeVisible();

    // Section How Kaza Works
    await expect(page.getByRole('heading', { name: 'How Kaza Works' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'For Tenants' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'For Owners' })).toBeVisible();

    // Newsletter
    await expect(page.getByRole('heading', { name: 'Stay ahead of the market' })).toBeVisible();
    await expect(page.locator('input[type="email"]').last()).toBeVisible();
  });

  test('le lien "Voir tout" mène vers /search', async ({ page, isMobile }) => {
    await page.goto('/');
    await acceptCookies(page);

    if (isMobile) {
      // En mobile, le lien "Voir tout" desktop est caché → on utilise le CTA "Voir toutes les propriétés"
      await page.getByRole('link', { name: /Voir toutes les propriétés/i }).click();
    } else {
      await page.getByRole('link', { name: /Voir tout/i }).first().click();
    }

    await expect(page).toHaveURL(/\/search/);
  });

  test('affiche le bandeau cookies puis le masque après acceptation', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator(selectors.cookieBanner);
    await expect(banner, 'Le bandeau cookies doit apparaître au premier passage').toBeVisible();

    await page.locator(selectors.acceptAllCookies).click();
    await expect(banner, 'Le bandeau doit disparaître après "Tout accepter"').toBeHidden();

    // Vérifie la persistance localStorage
    const stored = await page.evaluate(() => localStorage.getItem('kaza-cookie-consent'));
    expect(stored, 'Le consentement doit être persisté').not.toBeNull();
  });
});
