# Audit Wave 3 — Awa Cissé — 25 Mai 2026

**Verdict**: Wave 3 a livré **80% des chantiers critiques**. Identifiées 3 risques bloquants avant prod et 8 TODOs sans impact immédiat.

---

## 1. Livraisons Wave 3 — Tableau Agent

| Agent | Fichier | Livré | Notes |
|-------|---------|-------|-------|
| **Calendar** | `calendar.tsx` | ✅ | Implémentation légère (42j grid, locale fr-FR, sans react-day-picker) |
| **Dashboard Owner** | `owner/{rentals,payments,analytics}/page.tsx` | ✅ | Supabase + mock fallback (fetchWithFallback) |
| **Error Boundaries** | `(dashboard|main|admin)/error.tsx` | ✅ | 4 boundaries configurées (accueil + 3 segments) |
| **Realtime Messages** | `use-realtime-messages.ts` | ✅ | Hook + Postgres Changes (INSERT filter `recipient_id`) |
| **Typing Indicator** | `use-typing-indicator.ts` | ✅ | Broadcast ephemeral (2.5s timeout, throttle 1.5s) |
| **Message UI** | `message-{bubble,input}.tsx` | ✅ | Avatar + textarea auto-resize + Enter/Shift+Enter |
| **Messages Page** | `(dashboard)/messages/[conversationId]/page.tsx` | ❌ | **Fichier absent** — convention 1-1 définie mais RSC manquante |
| **FCM** | `notifications/fcm.ts` | ✅ | Legacy HTTP API, mode DEV (log) si `FCM_SERVER_KEY` absent |
| **Email (Resend)** | `notifications/resend.ts` | ✅ | API minimaliste, mode DEV si `RESEND_API_KEY` absent |
| **Dispatcher** | `notifications/dispatch.ts` | ✅ | 6 types, 3 canaux (in_app, push, email), best-effort |
| **Push Tokens Migration** | `00007_push_tokens.sql` | ✅ | user_push_tokens + RLS + index actif |
| **Realtime Publications** | `00008_realtime_publications.sql` | ✅ | 5 tables publiées (messages, notifications, visit_requests, etc.) |
| **Edge Function** | `send-notification/index.ts` | ✅ | Deno, appelle FCM/Resend, header Bearer |
| **Expense Split Hook** | `use-expense-split.ts` | ✅ | Greedy settlement, arrondi FCFA, O(n log n) |
| **Expense UI** | `student/expense-{card,split-summary}.tsx` | ✅ | Cartes + résumé balances/settlements |
| **Expenses Page** | `student/expenses/page.tsx` | ✅ | RSC + ExpensesTracker (mock pour l'instant) |
| **Virtual Tour** | `property/virtual-tour.tsx` | ✅ | Tabs (photos/video/tour360), drag/zoom, embed YouTube/Vimeo |
| **Property Detail** | `(main)/properties/[id]/page.tsx` | ✅ | VirtualTour intégrée + Supabase fallback mock |
| **Visit Requests** | `owner/visits/visits-list.tsx` | 🟡 | Supabase query manquante — reste mock pur + mockVisitRequests |

---

## 2. Régressions Détectées

- **Rupture 00008**: publication Realtime sur `contracts` + `identity_verifications` activée — aucune RLS restrictive en place (risque d'exposition mass-update).
- **Type Database**: `Database` type Supabase ne déclare pas relations FK → **12 TODOs** dans actions/pages. Impact : IntelliSense cassé, chaque query cast en `unknown as SupabaseClient`.
- **Messages [conversationId]/page.tsx**: fichier **inexistant**. Uniquement `use-realtime-messages()` hook + UI composants. La route ne rend rien.
- **Visits Storage**: aucune référence à buckets (identity-documents, contracts, property-photos) — création manuelle requise avant upload.

---

## 3. Pages Dashboard Encore en Mock Pur

| Page | Route | Statut |
|------|-------|--------|
| Owner Visits | `owner/visits/visits-list.tsx` | Mock (mockVisitRequests) |
| Tenant Payments | `tenant/payments/page.tsx` | Mock |
| Tenant Rentals | `tenant/rentals/page.tsx` | Mock |
| Student Expenses | `student/expenses/expenses-tracker.tsx` | Mock (à terme Supabase) |
| Admin Panel | `(admin)/*` | Mock guard + route (TODO sécurité Nia) |
| Contact Form | `contact.ts` action | Mock (TODO Nia: Resend) |
| Property New | `owner/properties/new/` | Mock (server action TODO Aminata) |

**Nombre pages mock**: 16 pages dashboard/main conservent mock-data imports. Pas de blocage — fallback gracieux.

---

## 4. Risques Sécurité / Dette Technique Restante

### 🔴 Bloquants pré-prod

1. **RLS manquant**: `contracts` + `identity_verifications` dans realtime sans policies restrictives.
   - **Fix**: ajouter filter RLS côté Postgres Changes ou désactiver publication.
   
2. **Messages page missing**: Realtime hook existe mais aucune page RSC `[conversationId]/page.tsx`.
   - **Fix**: créer `src/app/(dashboard)/messages/[conversationId]/page.tsx` (RSC + ConversationView).

3. **Storage buckets**: aucune création en SQL (identity-documents, contracts, property-photos).
   - **Fix**: `supabase storage create-bucket` ou migration SQL.

### 🟡 Technique

- **Type generation**: `Database` type manque 12 relations → casts `unknown` partout.
- **FCM/Resend keys**: DEV mode OK (log), prod nécessite env vars vérifié.
- **Typing indicator**: broadcast ephemeral (~2.5s) — acceptable MVP, monitoring recommandé en prod.

---

## 5. Checklist Pré-Production

### Vars d'Env à Fournir
```bash
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Notifications (obligatoire)
FCM_SERVER_KEY=AAAA...
RESEND_API_KEY=re_...
NOTIFICATIONS_FROM_EMAIL=noreply@kaza.africa

# Paiements (pour owner dashboard)
FEDAPAY_PUBLIC_KEY=pk_...
FEDAPAY_SECRET_KEY=sk_...
NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY=...

# Autres
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
TWILIO_ACCOUNT_SID=AC...
NEXT_PUBLIC_APP_URL=https://prod.kaza.africa
```

### Migrations Supabase (Ordre)
```sql
1. 00001_initial_schema.sql        (tables core)
2. 00002_rls_policies.sql          (base RLS)
3. 00003_indexes.sql               (perf)
4. 00004_notifications.sql         (notifs + enum)
5. 00005_verifications.sql         (identity)
6. 00006_contracts.sql             (contrats)
7. 00007_push_tokens.sql           (FCM)
8. 00008_realtime_publications.sql (activation realtime)
```

### Buckets Storage (Supabase UI ou CLI)
```bash
supabase storage create-bucket identity-documents --public=false
supabase storage create-bucket contracts --public=false
supabase storage create-bucket property-photos --public=true
```

### Policies RLS à Valider
- `user_push_tokens`: chaque user voit/crée seulement ses tokens ✅
- `messages`: sender_id OU recipient_id = auth.uid() ✅
- `contracts`: owner OU tenant ✅
- **`notifications` / `visit_requests`**: **À ajouter** — actuellement aucune restriction (broadcast public).

### Tests E2E (Playwright)
- [ ] Login propriétaire → créer visite → realtime visit_request arrive
- [ ] Chat 1-1: envoi message → recevoir via realtime + notif push
- [ ] Dépense partagée → settlementsvalides (greedy)
- [ ] Upload document identité → storage + DB
- [ ] Paiement → notification email via Resend

### Performance (Core Web Vitals)
- Calendar: 42 boutons DOM → monitor LCP (ajouter lazy-render si >100ms)
- Message list: virtualisation si >500 messages
- Property gallery: lazy-load images (next/image avec priority=false)

### SEO
- ✅ Sitemap: `sitemap.ts` existe
- [ ] robots.txt: à créer (`/public/robots.txt`)
- [ ] JSON-LD: Property schema sur pages détail
- [ ] OG metadata: openGraph défini sur pages clé

---

## 6. Top 5 Priorités Wave 4 (Si applicable)

1. **Compléter messages page** — créer `[conversationId]/page.tsx` RSC + intégration ConversationView. Blocage 100% pour live chat.

2. **Type generation Database** — régénérer types Supabase avec relations FK. Élimine 12 TODOs et les casts.

3. **RLS restrictif realtime** — ajouter policies `notifications` / `visit_requests` / `contracts`. Prevent broadcast leak.

4. **Tests E2E Playwright** — couvrir flows paiement, chat, dépense, visite. Actuellement 0 tests.

5. **Monitoring Sentry** — intégrer (`NEXT_PUBLIC_SENTRY_DSN`) pour tracer erreurs edge functions + client.

---

**Statut Wave 3 : PRESQUE PRÊTE** ✅🟡  
Créer messages page + valider RLS = Go for production.
