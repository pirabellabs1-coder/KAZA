# Tests E2E — KAZA

Suite Playwright pour la validation des parcours UI critiques de la plateforme.

## Prérequis

- Node.js 20+
- Dépendances installées : `npm install`
- Navigateurs Playwright : `npx playwright install`
  - Pour les builds CI minimaux : `npx playwright install --with-deps chromium`

## Lancer les tests

```bash
# Tous les tests, headless
npm run test:e2e

# Mode UI interactif (recommandé pour debug)
npm run test:e2e:ui

# Une seule spec
npx playwright test landing.spec.ts

# Un seul projet (chromium ou mobile)
npx playwright test --project=chromium
```

Le serveur de dev (`npm run dev` sur port 3001) est lancé automatiquement
par Playwright si aucun n'est déjà en écoute. Voir `webServer` dans
`playwright.config.ts`.

## Variables d'environnement

| Variable | Effet |
|----------|-------|
| `CI=1` | Active forbidOnly, retries=2, workers=1, reporter github |
| `PLAYWRIGHT_BASE_URL` | Surcharge l'URL de base (defaut http://localhost:3001) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Activent les tests qui requièrent Supabase live (sinon skip) |
| `E2E_TEST_USER_TOKEN` | Cookie de session Supabase pour tester les routes authentifiées |

## Structure

```
tests/
  e2e/
    fixtures.ts                   helpers communs (acceptCookies, selectors, mock data)
    landing.spec.ts               page d'accueil (/)
    search.spec.ts                page de recherche (/search)
    auth.spec.ts                  pages /login et /signup + redirection middleware
    dashboard-navigation.spec.ts  routes protégées (skip si Supabase absent)
  README.md                       ce fichier
```

## Coverage (rough)

| Parcours | Coverage |
|----------|----------|
| Landing — composition page + cookies + CTA vers /search | OK |
| Recherche — affichage cards, recherche texte, navigation détail | OK |
| Auth — affichage formulaires login/signup + redirect middleware | OK (skip si Supabase absent) |
| Dashboard — navigation sidebar | Skip en mode mock (requiert session live) |

## Projets

Deux projets parallèles configurés :

- **chromium** : Desktop Chrome (1280x720)
- **mobile** : iPhone 13 (390x844, touch)

Chaque test s'exécute sur les deux projets, sauf marquage explicite.

## Conventions

- Titres et commentaires en francais
- `expect(..., 'message')` pour expliciter les assertions critiques
- Pas de hardcoded timeout — preferer `waitForURL`, `toBeVisible()` (auto-retry)
- `test.skip(condition, 'raison')` pour les tests qui requièrent un backend live
- Selecteurs par rôle/texte plutôt que par classes CSS volatiles
