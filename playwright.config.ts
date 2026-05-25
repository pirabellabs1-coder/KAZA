import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests end-to-end de KAZA.
 *
 * Lance automatiquement le serveur de dev Next.js (port 3001) sauf si
 * un serveur tourne déjà. En CI, désactive forbidOnly + ajoute retries.
 *
 * Voir tests/README.md pour les instructions de lancement.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
    locale: 'fr-FR',
    timezoneId: 'Africa/Porto-Novo',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
