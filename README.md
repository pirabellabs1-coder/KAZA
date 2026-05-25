# KAZA

> La plus grande plateforme d'immobilier en Afrique. Bénin → Afrique de l'Ouest.

KAZA connecte directement **propriétaires**, **locataires** et **étudiants en colocation** : annonces vérifiées, vérification d'identité obligatoire, paiements Mobile Money sécurisés via escrow, contrats numériques signés électroniquement.

## Stack technique

- **Frontend** — Next.js 15 (App Router, RSC, Server Actions), React 19, TypeScript strict
- **Style** — Tailwind CSS v4 + shadcn/ui + radix-ui, mode clair uniquement
- **Backend** — Supabase (PostgreSQL + PostGIS, Auth, Storage, Realtime, Edge Functions Deno)
- **Paiements** — FedaPay (principal) + Kkiapay (fallback) — Mobile Money MTN / Moov + cartes
- **SMS** — Twilio (OTP vérification identité)
- **Email** — Resend
- **Push** — Firebase Cloud Messaging (web → mobile à venir)
- **Hébergement** — Vercel (frontend) + Supabase Cloud (backend)

Aucun serveur backend séparé. Toute la logique serveur vit dans :
- Server Actions Next.js (mutations + auth + paiements)
- Route Handlers Next.js (webhooks paiement)
- Edge Functions Supabase (PDF contrat, envoi notifications)
- Postgres RLS (autorisation au niveau ligne)

## Démarrer en local

```bash
# 1. Cloner et installer
git clone <repo> && cd KAZA
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Remplir au minimum NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
# Sans ces vars, le projet fonctionne en mode "mock data" — utile pour le développement UI

# 3. Lancer le serveur
npm run dev
# → http://localhost:3001
```

### Mode mock data
Toutes les pages utilisent un pattern `fetchWithFallback` (`src/lib/data-fetcher.ts`) qui retombe automatiquement sur les données mockées (`src/lib/mock-data.ts`) si Supabase n'est pas configuré. L'UI reste 100% navigable sans backend.

### Supabase local
```bash
# Lancer Supabase localement (Docker requis)
npx supabase start

# Appliquer toutes les migrations
npx supabase db reset

# Regénérer les types TypeScript après modification du schéma
npx supabase gen types typescript --local > src/types/supabase.ts
```

## Structure du projet

```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/                # Pages login/signup/forgot-password (layout minimal)
│   ├── (main)/                # Pages publiques (navbar + footer)
│   ├── (dashboard)/           # Espace authentifié (sidebar + header)
│   ├── (admin)/               # Espace admin (sidebar admin)
│   └── api/webhooks/          # Webhooks FedaPay, Kkiapay
├── actions/                   # Server Actions (mutations 'use server')
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── layout/                # navbar, footer, sidebar, bottom-nav
│   ├── property/              # cards, gallery, filters, virtual-tour
│   ├── messaging/             # bubble, input, conversation
│   ├── payments/              # method-selector, summary, escrow-timeline
│   ├── contracts/             # status-badge
│   ├── reviews/               # form, list, summary
│   ├── student/               # expense-card, split-summary, roommate-card
│   ├── admin/                 # sidebar admin, data-table, header
│   ├── marketing/             # section-hero, cta-banner, legal-toc
│   └── shared/                # empty-state, otp-input, cookie-banner, install-prompt
├── hooks/                     # useRealtimeMessages, useSwipe, useExpenseSplit…
├── lib/
│   ├── supabase/              # client, server, admin, middleware, queries
│   ├── payments/              # fedapay, kkiapay, types, façade
│   ├── notifications/         # fcm, resend, dispatch, templates
│   ├── pdf/                   # contract-builder
│   └── sms/                   # twilio
├── types/                     # supabase.ts, properties.ts, users.ts, payments.ts
├── validators/                # zod schemas
└── middleware.ts              # RBAC + refresh session

supabase/
├── migrations/                # 00001 → 00009
└── functions/                 # generate-contract-pdf, send-notification, verify-identity

.team/                         # Documentation collaborative (équipe virtuelle, war room)
```

## Espaces utilisateurs

| Espace | Route | Rôles autorisés |
|---|---|---|
| Public | `/`, `/search`, `/properties/[id]`, `/student-living`, `/about`, `/pricing`, `/faq`, `/how-it-works`, `/contact`, `/carrieres`, `/legal/*` | Tous |
| Auth | `/login`, `/signup`, `/forgot-password` | Non connectés |
| Locataire | `/tenant/*` | TENANT, ADMIN |
| Propriétaire | `/owner/*` | OWNER, ADMIN |
| Étudiant | `/student/*` | STUDENT, ADMIN |
| Transverse connecté | `/dashboard`, `/profile`, `/settings`, `/messages`, `/notifications`, `/verify-identity`, `/contracts` | Tous connectés |
| Admin | `/admin/*` | ADMIN uniquement |

Le contrôle est appliqué dans `middleware.ts` (RBAC avec cache cookie 5 min + fallback DB).

## Sécurité

- **Auth Supabase** sessions cookies httpOnly
- **RBAC middleware** sur tous les préfixes protégés
- **RLS Postgres** sur toutes les tables (`auth.uid()` + rôle)
- **Webhooks paiement** : signature HMAC SHA-256 timing-safe (FedaPay + Kkiapay)
- **Contrats** : hash SHA-256 des signatures, jamais le PNG en clair en DB
- **OTP SMS** : hash + TTL 10 min + max 5 tentatives
- **Storage** : 3 buckets avec policies scopées par userId/contractId/propertyId
- **Variables sensibles** : `SUPABASE_SERVICE_ROLE_KEY`, `FEDAPAY_SECRET_KEY`, etc. côté serveur uniquement

## Documentation

- [PRD](./PRD.md) — Spécifications produit complètes
- [Architecture](./ARCHITECTURE.md) — Décisions techniques, schémas
- [CLAUDE.md](./CLAUDE.md) — Instructions pour les agents IA
- [.team/](.team/) — Roster équipe virtuelle, journal et rapports par vague
- [.team/DEPLOY_CHECKLIST.md](.team/DEPLOY_CHECKLIST.md) — Checklist pré-production
- [openspec/](./openspec/) — Spec OpenSpec de la fondation MVP

## Scripts npm

```bash
npm run dev       # serveur de développement (port 3001)
npm run build     # build production
npm run start     # serve build production
npm run lint      # ESLint
```

## Contribution

Le projet est piloté par une équipe de 12 collaborateurs (cf. `.team/ROSTER.md`). Toute contribution passe par une PR revue par un autre membre. Les conventions sont décrites dans [CLAUDE.md](./CLAUDE.md).

## Licence

Propriétaire — KAZA SARL, Cotonou, Bénin. Tous droits réservés.
