# Yaw — Wave 4 (finitions)

## Mission
1. Remplacer les `alert()` par le helper `toast` d'Ibrahima (`@/components/ui/toast-helper`).
2. Brancher 3 pages dashboard restantes sur Supabase via `fetchWithFallback`.

## Fichiers touchés

| Fichier | Action | `alert()` remplacés | Toasts ajoutés |
| --- | --- | --- | --- |
| `src/app/(dashboard)/owner/visits/visits-list.tsx` | toast | 2 | 4 (success/info/error) |
| `src/app/(dashboard)/tenant/payments/checkout/checkout-form.tsx` | toast (+ erreurs inline conservées) | 2 | 5 (erreurs + redirect info) |
| `src/app/(dashboard)/verify-identity/verification-wizard.tsx` | toast (alongside `setError`) | 0 (pas d'`alert`, mais errors → toast.error en plus) | 8 (success steps + reportError helper) |
| `src/app/(dashboard)/owner/properties/properties-list.tsx` | aucun changement requis | 0 | 0 (fichier déjà clean) |
| `src/components/reviews/review-form.tsx` | toast alongside `setError` | 0 | 5 (validations + succès + erreurs) |
| `src/app/(main)/contact/contact-form.tsx` | toast alongside feedback inline | 0 | 2 (success + error) |
| `src/app/(dashboard)/tenant/payments/page.tsx` | Supabase via `fetchWithFallback` | — | — |
| `src/app/(dashboard)/dashboard/page.tsx` | Stats par rôle (OWNER/TENANT/STUDENT) via Supabase | — | — |

**Total `alert()` éliminés dans le périmètre : 4** (visits ×2, checkout ×2).
**Total composants munis d'un feedback toast : 6**.

## Branchements Supabase

### `tenant/payments/page.tsx`
- `loadTenantPayments()` interne qui appelle `fetchWithFallback`.
- Query Supabase : `payments` joint à `rentals!inner` (filtré sur `rental.tenant_id = user.id`) avec sous-select `properties(id, title)`.
- Fallback : `getPaymentsByUserId(MOCK_TENANT_ID)` + résolution du `property_title` via `mockRentals` + `getPropertyById`.
- Forme retournée normalisée (`PaymentRow extends Payment` + `property_title`) pour rendre les deux chemins interchangeables.
- Stats `totalPaid`, `pendingAmount`, `pendingCount` recalculées côté Server Component.

### `dashboard/page.tsx`
- Conserve la redirection legacy vers `/owner/properties` si pas de session ou rôle ADMIN.
- `getCurrentUser()` via `fetchWithFallback` (null si Supabase absent → redirection).
- Branche `OWNER` : `getOwnerStats()` existant (annonces actives, visites en attente, revenu cumulé, total propriétés).
- Branche `TENANT/STUDENT` : favoris (`saved_properties` count), paiements en attente (count + montant cumulé). Fallback mock via `getSavedPropertyIds` + `getPaymentsByUserId`.
- 4 `StatsCard` pour OWNER, 3 pour TENANT, plus une carte "Accès rapides" avec liens utiles.

## Conventions respectées
- Import unifié `import { toast } from "@/components/ui/toast-helper"`.
- Toutes les erreurs qui maintenaient un state `setError` affiché en inline conservent l'affichage inline ET déclenchent un `toast.error` pour feedback immédiat (verification-wizard, checkout-form, review-form, contact-form).
- Aucun changement de signature publique.
- TypeScript strict OK pour les fichiers touchés (les erreurs `next/*` du repo sont pré-existantes et hors-scope).

## Notes
- `properties-list.tsx` ne contient aucun `alert()` ni handler client de mutation : aucun changement nécessaire (le delete via DropdownMenu est encore un stub UI).
- 3 `alert()` subsistent dans le repo (`install-prompt.tsx`, `student/roommate-matching/page.tsx`, `student/expenses/new/page.tsx`) mais sont **hors périmètre Wave 4** assigné.
