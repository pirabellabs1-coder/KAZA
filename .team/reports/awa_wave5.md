# Wave 5 — Awa Cisse (QA Lead) — 25 Mai 2026

**Verdict** : suite E2E Playwright initiale en place, 4 specs + helpers + doc + scripts npm.

## Livraisons

| Fichier | Role |
|---------|------|
| `playwright.config.ts` | Config : 2 projets (chromium, mobile iPhone 13), webServer auto sur port 3001, locale fr-FR, timezone Africa/Porto-Novo, retries=2 en CI |
| `tests/e2e/fixtures.ts` | `acceptCookies()`, selecteurs partages, `isSupabaseConfigured()`, mock signup user |
| `tests/e2e/landing.spec.ts` | 3 tests : composition home (hero, listings, etudiant, how-it-works, newsletter), CTA "Voir tout" -> /search, bandeau cookies |
| `tests/e2e/search.spec.ts` | 3 tests : affichage cards + filtres, recherche texte injecte `?location=`, navigation vers /properties/[id] |
| `tests/e2e/auth.spec.ts` | 3 tests : champs /login, champs /signup + roles, redirection middleware (skip si Supabase absent) |
| `tests/e2e/dashboard-navigation.spec.ts` | 2 tests : routes protegees -> /login, navigation sidebar (skip mock-only) |
| `tests/README.md` | Doc prerequis, lancement, env vars, structure, coverage |
| `package.json` | +`test:e2e`, +`test:e2e:ui`, +devDep `@playwright/test@^1.49.0` (via Edit, fichier non reecrit) |

## Lancement

```bash
npm install                          # recupere @playwright/test
npx playwright install               # navigateurs
npm run test:e2e                     # headless, 2 projets
npm run test:e2e:ui                  # mode interactif
```

## Coverage rough

- **Couvert** : home publique (composition + cookies), recherche (UI + URL params + navigation detail), auth (UI formulaires)
- **Skip auto** (Supabase absent) : redirection middleware, navigation dashboard authentifiee
- **Non couvert MVP** : flux paiement, contrats, messagerie, upload (necessitent backend live + fixtures DB)

## Points d'attention

- Pas de `data-testid` dans le code source -> selecteurs par role/texte/id input (robuste mais a maintenir si copy change).
- Le test "Voir tout" gere mobile/desktop (lien desktop cache `sm:flex`, CTA mobile separe).
- Cookie banner persiste via `localStorage` -> contexte vierge a chaque test = banner systematique au premier passage.
- `dashboard-navigation.spec.ts` documente un placeholder d'injection de cookie session (`E2E_TEST_USER_TOKEN`) a affiner quand fixture Supabase dispo (Wave 6).
