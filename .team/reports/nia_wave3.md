# Wave 3 — Nia Owusu (DevOps / Sécurité)

## Mission
1. Composant `Calendar` shadcn manquant (wave 2).
2. Brancher 3 pages dashboard restantes sur Supabase via `fetchWithFallback`.
3. Error boundaries par segment.

## Fichiers créés / modifiés

### Créés
- `src/components/ui/calendar.tsx` — wrapper shadcn-like custom. Pas de
  dépendance externe (`react-day-picker` absent du `package.json`). API
  `{ mode: 'single', selected, onSelect, disabled, defaultMonth?, locale?,
  className? }`. Grille 7×6, semaine ISO (lundi → dimanche), header
  navigation `ChevronLeft/Right`, libellés `Intl.DateTimeFormat('fr-FR')`,
  jour sélectionné en `bg-kaza-blue text-white`, jour courant souligné par
  `border-kaza-blue/40`, jours d'autres mois en `text-muted-foreground/50`,
  jours désactivés grisés + barré + `disabled`. Fully accessible (`role`
  grid/gridcell, `aria-selected`, `aria-disabled`, `aria-label` navigation).
- `src/app/(dashboard)/error.tsx` — error boundary client pour l'espace
  utilisateur connecté. `Card` centrée, `AlertTriangle` rouge, message FR,
  boutons « Réessayer » (`reset()`) et « Retour à l'accueil » (`/dashboard`).
- `src/app/(main)/error.tsx` — variante pour pages publiques, retour vers `/`.
- `src/app/(admin)/error.tsx` — variante admin : bloc « Détails techniques »
  qui expose `error.message` et `error.digest` (selectable), retour vers
  `/admin`.

### Modifiés (mock → Supabase via `fetchWithFallback`)
- `src/app/(dashboard)/owner/rentals/page.tsx` — helper inline
  `loadOwnerRentals()` (jointure `rentals → properties (inner, owner_id) +
  tenant`), fallback `loadOwnerRentalsMock()` qui dérive les locations du
  propriétaire `u-002-owner-jean` via `getPropertiesByOwner`. UI inchangée.
- `src/app/(dashboard)/owner/payments/page.tsx` — helper
  `loadOwnerPayments()` (jointure imbriquée `payments → rentals → properties
  (inner, owner_id)`), fallback équivalent depuis `mockPayments`. Stats
  recalculées depuis le résultat unifié (compteur `PENDING` dynamique au
  lieu du « 1 paiement » hard-codé).
- `src/app/(dashboard)/owner/analytics/page.tsx` — branche sur
  `getOwnerStats(user.id)` (déjà fourni par `lib/supabase/queries/users`),
  fallback `computeMockStats()` qui calcule `totalProperties`,
  `activeListings`, `pendingVisits`, `totalRevenue` à partir des mocks.
  Suppression des chiffres en dur (« 18 », « 94% », etc.) — taux
  d'occupation calculé `rentedCount / totalProperties`. Ajout d'une carte
  « Revenus totaux encaissés » qui exploite `totalRevenue`.

## Décisions non couvertes par le brief
1. **`react-day-picker`** non installé : je suis resté sur l'implémentation
   custom plutôt que d'ajouter une dépendance. Le commentaire en tête du
   fichier indique comment migrer si la lib est ajoutée plus tard.
2. **Type loose Supabase** : j'utilise `(await createClient()) as unknown
   as SupabaseClient` dans les helpers `loadOwner*` (même pattern que
   `queries/users.ts` et `queries/properties.ts`, TODO type `Database`).
3. **Filtre `eq("property.owner_id", user.id)`** : appliqué sur la relation
   `!inner` pour que postgrest restreigne les `rentals`/`payments` aux
   biens du propriétaire connecté. Aligné sur la pratique PostgREST
   embedded filtering.
4. **`recentRequests`** dans `analytics/page.tsx` reste en placeholder
   (hors périmètre — fixture de design). À brancher lors d'une wave
   ultérieure quand un endpoint « activité récente » sera dispo.

## Tests
- `tsc --noEmit` : 0 erreur logique introduite par cette wave. Les seules
  remontées sur mes fichiers sont les erreurs pré-existantes `Cannot find
  module 'next/link'` / `Cannot find module 'next'` qui touchent
  l'ensemble du projet (déjà mentionnées dans `yaw_wave1.md`).
- Pas de test UI Playwright (env non installé dans ce contexte) — à passer
  par QA sur les 3 pages dashboard + les 3 error boundaries (throw factice
  via `?throw=1` ou similaire pour vérifier le rendu).

## À faire (autres équipiers)
- **Aminata / Yaw** : régénérer les types Supabase (`Database`) pour
  supprimer les casts `as unknown as SupabaseClient` dans les nouveaux
  helpers.
- **QA** : tester responsive des 3 pages owner + branchement réel avec
  un compte propriétaire après seed Supabase ; tester reset des error
  boundaries.
