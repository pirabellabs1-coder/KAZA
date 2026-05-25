# Audit QA Wave 1 — Awa Cissé

**Mode** : lecture seule. Findings issus de l'inspection du repo `F:\KAZA`.

## 1. Pages existantes — État par page

29 pages codées :
- `(main)` : 8 pages — homepage, search, properties listing + detail, student-living + detail, about
- `(auth)` : 3 pages — login, signup, forgot-password
- `(dashboard)` : 18 pages — owner (properties, visits, rentals, payments, analytics), tenant (saved, rentals, payments, messages), student (colocations, requests, expenses, chat), messages (list + detail), profile, settings

**Observations transverses** :
- ✓ `EmptyState` utilisé sur student/requests et tenant/rentals
- ✗ Pas de loading skeletons
- ✗ Pas d'error boundaries par page
- ✗ Toutes les pages utilisent `src/lib/mock-data.ts`, aucune ne requête Supabase
- ✓ Aucun lien `<Link href="...">` cassé détecté
- ✓ Structure cohérente, code propre

## 2. Pages maquettées non codées

Dossiers à racine repo qui n'ont pas d'équivalent dans `src/app/` :
- `admin_dashboard_kaza`, `fraud_detection_kaza_admin`, `identity_approval_kaza_admin`, `property_moderation_kaza_admin`, `reports_disputes_kaza_admin`, `user_management_kaza_admin`, `platform_analytics_kaza_admin`, `platform_settings_kaza_admin` → **Ibrahima (wave 1)**
- `identity_verification_kaza`, `owner_verification_kaza` → wave 2
- `contract_generation_kaza`, `rental_contract_kaza` → wave 2
- `escrow_status_kaza`, `installment_payments_kaza`, `mobile_money_payment_kaza`, `card_payment_kaza` → Kwame infra (wave 1) ; pages UI à câbler wave 2
- `notifications_kaza` → **Chiamaka (wave 1)**
- `faq_kaza`, `contact_kaza`, `how_it_works_kaza`, `pricing_services_kaza` → **Moussa (wave 1)**
- `roommate_matching_kaza`, `roommate_profile_kaza`, `find_roommates_kaza_student`, `publish_shared_room_kaza`, `shared_rent_management_kaza`, `payment_split_kaza_student`, `student_dashboard_kaza`, `student_housing_kaza` → wave 2 (renforcement student)
- `booking_requests_kaza_tenant`, `tenant_requests_kaza`, `rentals_calendar_kaza`, `transaction_history_kaza`, `wallet_detail_kaza`, `wallet_portefeuille_kaza` → wave 2
- Mobiles : `messagerie_mobile`, `recherche_de_biens_mobile`, `d_tails_du_bien_mobile`, `tableau_de_bord_propri_taire_mobile`, `tableau_de_bord_locataire_mobile`, `portefeuille_wallet_mobile` → PWA déjà couverte par Olamide ; spécifiques mobile à fusionner

## 3. Composants UI manquants

Présents : avatar, badge, button, card, dialog, dropdown-menu, input, label, select, separator, sheet, skeleton, tabs, textarea, tooltip.

Manquants à ajouter (shadcn/ui patterns) :
- `accordion` (FAQ — Moussa l'attaque)
- `alert`
- `calendar` (disponibilités, visites)
- `command` (search palette)
- `popover` (datepicker, menus)
- `progress` (wizard, escrow status)
- `slider` (filtres prix)
- `switch` (settings)
- `table` (admin tables — Ibrahima crée son data-table maison)
- `toast` / `sonner` (feedback actions)

## 4. Fonctionnalités PRD non couvertes

| Domaine | Manquant |
|---|---|
| Identité | Upload pièce + selfie + OTP SMS Twilio |
| Paiements | Tunnel UI Mobile Money complet, paiement progressif, page escrow status |
| Contrats | Génération PDF (`@react-pdf/renderer`), signature électronique |
| Messagerie | Realtime Supabase (actuellement static) |
| Notifications | Push FCM, email Resend, SMS Twilio |
| Visites | Calendrier disponibilités, demande de créneau, confirmation |
| Admin | Tout (wave 1 le couvre via Ibrahima) |
| Avis | UI form + listing (Chiamaka wave 1), persistance backend (Aminata) |
| Étudiant | Matching colocataires, partage de frais avancé |
| Visite virtuelle | Galerie 360° / vidéo tour |

## 5. Sécurité / Middleware

`middleware.ts` actuel :
- ✓ Refresh session Supabase
- ✓ Protection `/owner/*`, `/tenant/*`, `/student/*`, `/dashboard/*`, `/profile/*`, `/settings/*`, `/messages/*`
- ✓ Redirection vers `/login?redirect=...`
- ✗ **Aucun contrôle de rôle** : un OWNER peut voir `/tenant/*` et inversement
- ✗ Aucune protection `/admin/*` (en cours d'ajout par Ibrahima dans son layout)

## 6. Top 10 priorités Wave 2

1. **RBAC dans middleware** — vérifier `users.role` et bloquer croisement (Nia + Aminata)
2. **Brancher pages dashboard sur server actions Aminata** — sortir de mock-data (Yaw + Chiamaka)
3. **Toaster global** (`sonner`) + composants `alert`, `progress`, `table`, `switch`, `popover` (Ibrahima)
4. **Tunnel vérification identité** — page upload pièce + selfie + OTP SMS (Aminata + Chiamaka)
5. **Tunnel paiement bout-en-bout** — page de paiement choix méthode + redirection FedaPay + page de retour succès/échec (Kwame + Yaw)
6. **Messagerie Realtime** — Supabase channels (Aminata + Yaw)
7. **Génération contrat PDF + signature** — Edge Function + page contrat (Kwame Edge Function, Chiamaka UI)
8. **Page escrow status** + paiements progressifs (Kwame + Chiamaka)
9. **Renforcement étudiant** — roommate matching + payment split (Yaw + Chiamaka)
10. **Error boundaries + loading skeletons** par page (Awa + Chiamaka)

**Verdict** : fondations saines. La wave 1 actuelle adresse 6/10 directement, la wave 2 doit traiter le reste plus le RBAC qui est un trou de sécurité.
