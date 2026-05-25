# Audit Wave 2 — Awa Cissé

## 1. Livraisons wave 2 vérifiées

| Domaine | Livré | Notes |
|---|---|---|
| Contrats (génération PDF, signatures SHA-256, cycle DRAFT→PENDING_TENANT→PENDING_OWNER→SIGNED) | 🟡 | `src/actions/contracts.ts`, Edge Function `generate-contract-pdf/`, migration 00006, page liste `/contracts`, status-badge, RLS. **Manque** : page détail `/contracts/[id]/page.tsx` + `signature-pad.tsx` |
| Paiements locataire (tunnel checkout → success/cancel) | ✅ | Pages `/tenant/payments/{checkout,success,cancel}`, CheckoutForm, PaymentSummary, EscrowTimeline, action `initiateRentPayment` |
| Escrow (page statut + timeline) | ✅ | `/tenant/escrow/page.tsx` + `escrow-timeline` |
| Identité (wizard 3 étapes phone OTP + docs + selfie, RLS, migration 00005) | ✅ | `/verify-identity/page.tsx` + wizard, `requestPhoneOtp/verifyPhoneOtp/uploadIdentityFile/submitIdentityVerification`, bucket storage, max 5 tentatives OTP |
| RBAC middleware (OWNER/TENANT/STUDENT/ADMIN, cache cookie 5 min + DB fallback) | ✅ | `middleware.ts` : ROLE_RULES, cache rôle, redirection cohérente, pas de croisement /owner ↔ /tenant |
| Composants UI (alert, progress, switch, table, popover, sonner, toast-helper) | ✅ | Tous présents, sonner Toaster monté en root layout |
| Roommate matching étudiant | ✅ | `/student/roommate-matching/page.tsx` + `matching-filters.tsx` |
| Pages légales | 🟡 | CGU ✅, mentions légales ✅. **Manque** : confidentialité, cookies, carrières + détail poste |
| Mobile UX (gallery swipe, conversation, sticky CTA, pull-refresh, hooks) | ✅ | Tous composants livrés, `mobile.css` à importer dans root layout |

## 2. Régressions détectées

Aucune. Middleware RBAC sain, 29 pages wave 1 opérationnelles, composants UI wave 1 intacts.

## 3. Pages encore en mock pur (cible wave 3)

15 pages :
- Owner : `properties` (liste + détail), `rentals`, `payments`, `visits`, `analytics`
- Tenant : `payments` (historique), `messages`
- Student : `colocations`, `requests`, `expenses`, `chat`
- Main : `properties`, `student-living` (liste + détail)
- Sitemap : génération dynamique à câbler

*Note : `(main)/page.tsx`, `(main)/search`, `(main)/properties/[id]`, `owner/properties`, `tenant/saved` ont déjà été branchées en wave 2.5 via `fetchWithFallback`.*

## 4. Composants / features manquants vs PRD

| Espace | Manquant |
|---|---|
| Paiement | Choix provider FedaPay vs Kkiapay côté UI (façade prête), paiement progressif détaillé |
| Notifications | Push FCM mobile + email Resend (Edge Functions prêtes) |
| Messagerie | Realtime Supabase Channels (DB OK, UI statique) |
| Visites | Calendrier `ui/calendar` + formulaire créneau |
| Légal | Confidentialité, Cookies, Carrières (3 pages) |
| Étudiant | Payment split UI |
| Annonce | Visites virtuelles (galerie 360° / iframe vidéo) |

## 5. Risques sécurité

**Mitigés** :
- RBAC enforcé middleware
- Signatures contrats SHA-256, jamais PNG en clair
- OTP SMS : hash + 5 tentatives + TTL 10 min
- RLS identité : un user ne voit que sa propre vérif

**À surveiller** :
- Edge Function `generate-contract-pdf` dépend de la lib PDF — tester perf et timeout en sandbox
- Bucket `contracts` privé OK, valider permissions Storage RLS avant prod

## 6. Top 10 priorités wave 3

1. **Brancher dashboard owner/properties + tenant/rentals sur server actions** — sortir mock-data
2. **Compléter page détail contrat + signature pad** (Kwame 🟡)
3. **Compléter pages légales manquantes** (Moussa 🟡)
4. **Realtime messagerie** — Supabase Channels (code prêt, UI à câbler)
5. **Câbler `toast.success/error` dans toutes les server actions front** (au lieu de `alert`)
6. **Calendrier visites** — composant `ui/calendar` + formulaire créneau
7. **Push notifications** FCM + email Resend
8. **Payment split étudiant** UI
9. **Visites virtuelles** (gallerie 360° ou iframe vidéo)
10. **Error boundaries + fallback UI** par page top-level

**Verdict** : Wave 2 solide. RBAC ✅, identité ✅, contrats ✅, tunnel paiement ✅, mobile ✅, lib UI ✅. Aucune régression. Reste : 5 pages spécifiques à finir + branchement Supabase étendu + Realtime.
