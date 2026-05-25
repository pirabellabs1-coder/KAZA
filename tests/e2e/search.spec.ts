import { expect, test } from '@playwright/test';

import { acceptCookies, selectors } from './fixtures';

/**
 * Tests E2E — Page de recherche `/search`.
 *
 * Vérifie l'affichage de la barre de recherche, des filtres, des cards,
 * et les flux de recherche par texte et de navigation vers le détail.
 */
test.describe('Page de recherche', () => {
  test('affiche la barre de recherche, les filtres et au moins une PropertyCard', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/search');
    await acceptCookies(page);

    // Barre de recherche compacte
    await expect(page.locator(selectors.compactSearchInput)).toBeVisible();

    // Au moins une PropertyCard (mock data fallback si Supabase absent)
    const cards = page.locator(selectors.propertyCardLink);
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(1);

    // Filtres — heading "Filtres" présent (sidebar desktop ou sheet mobile).
    // En desktop, sidebar visible directement. En mobile, présence du trigger.
    if (!isMobile) {
      await expect(page.getByRole('heading', { name: 'Filtres' }).first()).toBeVisible();
    }
  });

  test('la recherche par localisation injecte ?location= dans l\'URL', async ({ page }) => {
    await page.goto('/search');
    await acceptCookies(page);

    const input = page.locator(selectors.compactSearchInput);
    await input.fill('Cotonou');
    await input.press('Enter');

    await page.waitForURL(/[?&]location=Cotonou/);
    await expect(page).toHaveURL(/[?&]location=Cotonou/);
  });

  test('cliquer sur une PropertyCard mène vers /properties/[id]', async ({ page }) => {
    await page.goto('/search');
    await acceptCookies(page);

    const firstCard = page.locator(selectors.propertyCardLink).first();
    await expect(firstCard).toBeVisible();

    const href = await firstCard.getAttribute('href');
    expect(href, 'La card doit pointer vers /properties/[id]').toMatch(
      /^\/properties\/[^/]+$/,
    );

    await firstCard.click();
    await expect(page).toHaveURL(/\/properties\/[^/]+$/);
  });
});
