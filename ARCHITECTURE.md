# KAZA - Architecture Technique

**Date** : 19 Mars 2026 | **Statut** : Valide

---

## Table des Matieres

**Partie I - Decisions et Justifications**
1. [Resume des Choix](#1-resume-des-choix)
2. [Contraintes du Projet](#2-contraintes-du-projet)
3. [Choix Frontend : Next.js 15+](#3-choix-frontend--nextjs-15)
4. [Choix Backend : Supabase](#4-choix-backend--supabase)
5. [Choix Paiements : FedaPay](#5-choix-paiements--fedapay)

**Partie II - Architecture Detaillee**
6. [Vue d'Ensemble](#6-vue-densemble)
7. [Stack Technique Complet](#7-stack-technique-complet)
8. [Structure du Projet](#8-structure-du-projet)
9. [Base de Donnees](#9-base-de-donnees)
10. [Authentification](#10-authentification)
11. [Paiements Mobile Money](#11-paiements-mobile-money)
12. [Messagerie Temps Reel](#12-messagerie-temps-reel)
13. [Storage et Images](#13-storage-et-images)
14. [Recherche Geo-Spatiale](#14-recherche-geo-spatiale)
15. [SEO](#15-seo)
16. [PWA et Offline](#16-pwa-et-offline)
17. [Internationalisation](#17-internationalisation)
18. [Performance et Latence](#18-performance-et-latence)
19. [Deploiement](#19-deploiement)
20. [Tests](#20-tests)

**Partie III - Couts et Risques**
21. [Estimation des Couts](#21-estimation-des-couts)
22. [Risques et Mitigations](#22-risques-et-mitigations)
23. [Phases de Developpement](#23-phases-de-developpement)

---

# PARTIE I - DECISIONS ET JUSTIFICATIONS

---

## 1. Resume des Choix

Apres analyse de 4 frameworks frontend, 2 plateformes BaaS, et 9 providers de paiement africains :

| Couche | Technologie | Raison Principale |
|--------|------------|-------------------|
| **Frontend** | Next.js 15+ (App Router) | SEO, optimisation images, ecosysteme React |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Composants accessibles, design system rapide |
| **Backend/BaaS** | Supabase | PostgreSQL natif, PostGIS, Realtime, Auth, Storage |
| **Base de Donnees** | PostgreSQL (via Supabase) | Schema relationnel du PRD, recherche geo-spatiale |
| **Paiements** | FedaPay (principal) + Kkiapay (fallback) | Couverture Benin native, SDK Node.js, meilleurs tarifs |
| **Storage Images** | Supabase Storage + CDN | Transformation images integree, RLS |
| **Temps Reel** | Supabase Realtime | Messagerie, notifications, 6ms latence mediane |
| **Deploiement** | Vercel (frontend) + Supabase Cloud | Edge network, zero-config, scaling auto |
| **Cartes** | Mapbox GL JS | Meilleure couverture Afrique, offline maps |
| **SMS/Notifications** | Twilio (SMS OTP) + Firebase Cloud Messaging | Fiabilite, couverture Benin |

---

## 2. Contraintes du Projet

Le contexte africain est determinant pour chaque choix technique :

| Contrainte | Impact sur le Stack |
|-----------|-------------------|
| **Connectivite** : 40% des connexions en Afrique Sub-Saharienne sont 2G/3G | Bundle JS minimal, optimisation images agressive, PWA offline |
| **Appareils** : Smartphones Android mid-range (2-3 Go RAM) dominent | Pas de frameworks lourds, lazy loading obligatoire |
| **Paiements** : Mobile Money est le standard (pas les cartes bancaires) | Providers locaux obligatoires (FedaPay, Kkiapay), pas Stripe |
| **SEO** : Decouverte via Google et partage WhatsApp/Facebook | SSR obligatoire, Open Graph images, meta dynamiques |
| **Timeline** : MVP en 4 semaines | BaaS pour accelerer, pas de backend from scratch |
| **Scale** : 500 -> 100k utilisateurs en 12 mois | Architecture qui scale sans re-ecriture |
| **Langue** : Francophone (Benin, Togo, CI, Senegal) | i18n, communaute dev francophone |

---

## 3. Choix Frontend : Next.js 15+

### Comparatif

| Critere (poids) | Next.js 15+ | Nuxt 4 | SvelteKit 2 | Remix/RR v7 |
|-----------------|:-----------:|:------:|:-----------:|:-----------:|
| SSR/SSG (10%) | 9.5 | 9.0 | 8.5 | 8.0 |
| **SEO** (15%) | **9.5** | 9.0 | 7.0 | 7.5 |
| DX / Ecosysteme (10%) | 9.0 | 9.0 | 7.5 | 7.5 |
| Mobile-First (8%) | 8.5 | 8.5 | 8.0 | 7.5 |
| **Bundle Size / Perf low-end** (15%) | 8.0 | 8.0 | **9.5** | 6.5 |
| **PWA** (12%) | 7.5 | **9.0** | **9.0** | 5.0 |
| **Communaute / Emploi** (10%) | **10.0** | 8.0 | 6.0 | 7.0 |
| Integration Supabase (8%) | **9.5** | 9.0 | 8.0 | 7.5 |
| TypeScript (7%) | 9.0 | 9.0 | 8.5 | 9.5 |
| **Optimisation Images** (15%) | **10.0** | 9.5 | 6.5 | 5.0 |
| **SCORE PONDERE** | **9.21** | **8.93** | **7.99** | **6.93** |

### Pourquoi Next.js 15+

1. **Optimisation images native** (`next/image`) : conversion automatique WebP/AVIF, `srcset` responsive, lazy loading. Reduit les photos de proprietes de 60-80%. Critique pour la bande passante africaine.

2. **SEO complet** : `generateMetadata()` dynamique, `sitemap.ts` et `robots.ts` integres, JSON-LD pour Google Rich Results sur les annonces immobilieres.

3. **React Server Components (RSC)** : les pages de listing sont rendues cote serveur avec zero JS envoye au client. Reduit massivement le bundle sur appareils low-end.

4. **Integration Supabase officielle** : `@supabase/ssr` gere l'auth cookie-based dans l'App Router correctement.

5. **Talent pool** : 68% des devs JS utilisent Next.js. Plus facile de recruter au Benin et en Afrique de l'Ouest.

> **Note** : Nuxt 4 (score 8.93) serait une alternative valable si l'equipe maitrise Vue.js.

---

## 4. Choix Backend : Supabase

### Comparatif Supabase vs Firebase

| Critere | Supabase | Firebase |
|---------|:--------:|:-------:|
| **Base de donnees** | PostgreSQL (relationnel, SQL) | Firestore (NoSQL, document) |
| **Recherche immobiliere multi-filtres** | **Natif** (SQL WHERE + AND illimite) | **Limite** (max 1 inegalite par requete) |
| **Recherche geo-spatiale** | **PostGIS natif** (rayon, distance, polygones) | Geohash uniquement (5.4x lectures en trop) |
| **Schema PRD** | Compatible directement (SQL fourni) | Re-modelisation complete necessaire |
| **Auth** | Email, OTP SMS, OAuth, MFA, RLS | Email, OTP, OAuth, MFA, Security Rules |
| **Storage** | S3-compatible + **transformations images integrees** | GCS, pas de transformation integree |
| **Realtime** | 224K msg/sec, 6ms mediane, RLS applique | ~600ms RTT Firestore, bon offline |
| **Open Source** | Oui (auto-hebergeable) | Non |
| **Region Afrique** | Non (eu-central-1 le plus proche, ~200ms) | Oui (`africa-south1` Johannesburg) |
| **Cout a 100k users** | ~$35-45/mois (Pro plan) | ~$35-70/mois (lecture-intensif = cher) |
| **Pricing model** | Ressources (previsible) | Par operation (imprevisible pour lecture intensive) |
| **Offline mobile** | Pas natif (besoin TanStack Query) | **Natif** (IndexedDB, conflict resolution) |

### Pourquoi Supabase

**La recherche immobiliere est le coeur du produit.** Voici la meme requete dans les deux systemes :

**Supabase / PostgreSQL + PostGIS (1 requete SQL) :**
```sql
SELECT p.*, ST_Distance(
    p.location::geography,
    ST_MakePoint(6.3703, 2.3912)::geography -- Cotonou
  ) AS distance_m
FROM properties p
WHERE p.price BETWEEN 50000 AND 200000
  AND p.bedrooms >= 2
  AND p.property_type IN ('APARTMENT', 'HOUSE')
  AND p.status = 'AVAILABLE'
  AND ST_DWithin(
    p.location::geography,
    ST_MakePoint(6.3703, 2.3912)::geography,
    5000  -- 5km rayon
  )
ORDER BY distance_m ASC
LIMIT 20;
```

**Firebase Firestore (impossible en 1 requete) :**
```javascript
// IMPOSSIBLE : Firestore ne permet PAS plusieurs inegalites
// sur des champs differents dans une seule requete.
// Il faut :
// 1. Fetcher un sur-ensemble avec geohash (5.4x trop de docs)
// 2. Filtrer prix cote client
// 3. Filtrer chambres cote client
// 4. Trier par distance cote client
// = Lent, couteux, mauvaise UX
```

---

## 5. Choix Paiements : FedaPay

### Comparatif Providers pour le Benin

| Provider | HQ | Benin Natif | Operators Benin | SDK Node.js | Frais Mobile Money | Score |
|----------|:--:|:-----------:|:---------------:|:-----------:|:-----------------:|:-----:|
| **FedaPay** | Cotonou | Oui | MTN, Moov, Celtiis, Coris, BMO | `npm install fedapay` (officiel) | 1.8% (MTN) | **9.5/10** |
| **Kkiapay** | Cotonou | Oui | MTN, Moov, Celtiis, Wave | CDN JS SDK (widget) | 1.5% (client paie) | **9.0/10** |
| **QOSPAY** | Cotonou | Oui | MTN, Moov | REST API + USSD | Non publie | 7.5/10 |
| **FeexPay** | Cotonou | Oui | Moov seulement | REST API | 1.5-1.7% | 6.5/10 |
| **PawaPay** | Londres | Oui (via Kerry) | MTN, Moov | REST API | 1% + frais operateur | 7.0/10 |
| **Flutterwave** | San Francisco | **Non** | N/A | Officiel npm | 1.4-2% | 4.0/10 |
| **Paystack** | Lagos | **Non** | N/A | Excellent | 1.5%+ | 3.0/10 |
| **PayDunya** | Dakar | Oui | MTN, Moov | Communautaire | Non publie | 6.0/10 |
| **CinetPay** | Abidjan | Historique | Moov | Officiel | 2.5-3.5% | **EVITER** |

### Alertes Critiques

- **CinetPay** : En crise depuis septembre 2025 (cyberattaque, >$1.2M de dettes non resolues, enquete regulatoire au Senegal). **A eviter absolument.**
- **PayDunya** : Acquis par Peach Payments (Afrique du Sud) en avril 2025. API fonctionnelle mais avenir incertain.
- **Flutterwave/Paystack** : Ne supportent **pas** le Benin nativement pour Mobile Money.

### Strategie Retenue

| Role | Provider | Justification |
|------|----------|--------------|
| **Principal** | **FedaPay** | Base a Cotonou, SDK Node.js officiel, 5 operators Benin, expansion UEMOA native, tarifs transparents |
| **Fallback** | **Kkiapay** | Widget drop-in (integration la plus rapide), bon pour prototypage MVP |
| **Futur multi-pays** | **PawaPay** | API unique pour 20+ pays africains, ideal pour expansion V3+ |

---

# PARTIE II - ARCHITECTURE DETAILLEE

---

## 6. Vue d'Ensemble

KAZA est une plateforme immobiliere web ciblant le Benin puis l'Afrique de l'Ouest. L'architecture repose sur **Next.js 15+** comme couche frontend et backend unifie (Server Actions), **Supabase** comme Backend-as-a-Service (PostgreSQL, Auth, Storage, Realtime), et **FedaPay** pour les paiements Mobile Money.

Il n'y a pas de serveur backend separe. Toute la logique serveur vit dans :
- **Next.js Server Actions** : mutations (creation annonce, paiement, signature contrat)
- **Next.js Route Handlers** : webhooks (FedaPay, Twilio), APIs publiques
- **Supabase Edge Functions** : taches asynchrones (notifications, generation PDF, verification identite)
- **Supabase RLS** : autorisation au niveau de la base de donnees

```
Utilisateurs (Navigateur / PWA)
         |
    Vercel Edge Network (CDN global)
         |
    Next.js 15+ App Router
    ├── Server Components (rendu SSR, zero JS client)
    ├── Server Actions (mutations securisees)
    ├── Route Handlers (webhooks, APIs)
    └── Client Components (interactivite : carte, filtres, chat)
         |
    Supabase Cloud (eu-central-1 Frankfurt)
    ├── PostgreSQL 15 + PostGIS + pg_trgm
    ├── Auth (JWT + Row Level Security)
    ├── Storage (photos, documents, KYC)
    ├── Realtime (messagerie WebSocket)
    └── Edge Functions (Deno)
         |
    Services Externes
    ├── FedaPay (Mobile Money)
    ├── Twilio (SMS OTP)
    ├── Firebase Cloud Messaging (push notifications)
    ├── Mapbox GL JS (cartes)
    └── Resend (emails transactionnels)
```

### Diagramme d'Architecture

```
                         UTILISATEURS
                    (Navigateurs / PWA Mobile)
                              |
                    +---------+---------+
                    |                   |
              +-----v------+    +------v------+
              |   Vercel    |    | Cloudflare  |
              | Edge Network|    |   DNS/CDN   |
              +-----+------+    +------+------+
                    |                   |
                    +--------+----------+
                             |
                   +---------v---------+
                   |    Next.js 15+    |
                   |   (App Router)    |
                   |  Server Components|
                   |  Server Actions   |
                   |  Route Handlers   |
                   +---------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v---+  +------v------+  +----v--------+
     |  Supabase  |  |  Supabase   |  |  Supabase   |
     |  Auth      |  |  PostgreSQL |  |  Storage    |
     | (JWT+RLS)  |  | + PostGIS   |  | (S3-compat) |
     +--------+---+  +------+------+  +----+--------+
              |              |              |
              +--------------+--------------+
                             |
                   +---------v---------+
                   |    Supabase       |
                   |    Realtime       |
                   | (WebSocket/WAL)   |
                   +-------------------+
                             |
         +-------------------+-------------------+
         |                   |                   |
   +-----v-----+     +------v------+    +-------v-----+
   |  FedaPay   |     |   Twilio    |    |   Firebase  |
   |  (Mobile   |     |  (SMS OTP)  |    |    FCM      |
   |   Money)   |     |             |    | (Push Notif)|
   +-----------+      +-------------+    +-------------+
```

### Flux de Donnees Cle : Recherche de Propriete

```
1. Utilisateur tape "Appartement 2 chambres Cotonou < 150k"
                          |
2. Next.js Server Component -> appel Supabase
                          |
3. PostgreSQL + PostGIS execute :
   - Filtres : prix, chambres, type, status
   - Geo : ST_DWithin(5km de Cotonou)
   - Tri : distance ASC
   - Pagination : LIMIT 20 OFFSET 0
                          |
4. Supabase Storage sert les images
   -> next/image convertit en WebP/AVIF
   -> Vercel CDN cache en edge
                          |
5. Resultat rendu en SSR (zero JS pour le listing)
   -> Seuls les composants interactifs (filtres, carte)
      sont hydrates cote client
```

---

## 7. Stack Technique Complet

### Frontend

| Technologie | Version | Role |
|-------------|---------|------|
| Next.js | 15+ (App Router) | Framework fullstack, SSR, RSC, Server Actions |
| React | 19 | Bibliotheque UI |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 4 | Styling utility-first |
| shadcn/ui | latest | Composants UI accessibles (Radix UI) |
| React Hook Form | 7.x | Gestion formulaires |
| Zod | 3.x | Validation schemas (client + serveur) |
| Zustand | 5.x | State management client (leger) |
| Mapbox GL JS | 3.x | Cartes interactives, geocoding |
| next-intl | latest | Internationalisation (francais par defaut) |
| @ducanh2912/next-pwa | latest | Progressive Web App, offline |

### Backend / BaaS

| Technologie | Role |
|-------------|------|
| Supabase | Plateforme BaaS (DB, Auth, Storage, Realtime, Edge Functions) |
| PostgreSQL 15+ | Base de donnees relationnelle |
| PostGIS | Extension geo-spatiale (recherche par rayon, distance) |
| pg_trgm | Recherche texte fuzzy (noms de quartiers, villes) |
| Supabase Auth | Authentification (email/password, OTP SMS, OAuth Google) |
| Supabase Storage | Stockage fichiers (photos, documents, KYC) |
| Supabase Realtime | Messagerie temps reel (WebSocket via WAL) |
| Supabase Edge Functions | Logique asynchrone (Deno runtime) |
| @supabase/ssr | Integration auth cookie-based avec Next.js App Router |

### Paiements

| Technologie | Role |
|-------------|------|
| FedaPay | Paiements Mobile Money principal (MTN, Moov, Celtiis, Coris, BMO) |
| Kkiapay | Fallback / widget drop-in pour prototypage |

### Infrastructure

| Service | Role |
|---------|------|
| Vercel | Hosting frontend + Edge Network CDN |
| Supabase Cloud (eu-central-1) | Hosting backend, DB, storage |
| Cloudflare | DNS, protection DDoS, cache supplementaire |
| Sentry | Monitoring erreurs, performance |
| Vercel Analytics | Metriques web (Core Web Vitals) |

### Services Externes

| Service | Role |
|---------|------|
| Twilio | SMS OTP (verification telephone) |
| Resend | Emails transactionnels (confirmations, notifications) |
| Firebase Cloud Messaging | Push notifications (gratuit) |
| Mapbox | Cartes, geocoding, recherche d'adresses |
| @react-pdf/renderer | Generation de contrats PDF cote serveur |

---

## 8. Structure du Projet

```
kaza/
├── public/
│   ├── images/                     # Assets statiques (logo, icones)
│   ├── manifest.json               # PWA manifest
│   └── sw.js                       # Service worker (genere par next-pwa)
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Groupe : pages non-authentifiees
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (main)/                 # Groupe : pages publiques
│   │   │   ├── page.tsx            # Landing page (Home)
│   │   │   ├── search/
│   │   │   │   └── page.tsx        # Resultats recherche
│   │   │   ├── properties/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx    # Detail propriete
│   │   │   │   └── page.tsx        # Liste proprietes
│   │   │   ├── student-living/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx    # Detail colocation
│   │   │   │   └── page.tsx        # Liste colocations
│   │   │   └── about/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/            # Groupe : pages authentifiees
│   │   │   ├── layout.tsx          # Layout dashboard (sidebar + header)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Redirection selon role
│   │   │   ├── owner/              # Espace proprietaire
│   │   │   │   ├── properties/
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── visits/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── rentals/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payments/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx
│   │   │   ├── tenant/             # Espace locataire
│   │   │   │   ├── saved/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── rentals/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── payments/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── messages/
│   │   │   │       └── page.tsx
│   │   │   ├── student/            # Espace etudiant
│   │   │   │   ├── colocations/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── requests/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── expenses/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── chat/
│   │   │   │       └── page.tsx
│   │   │   ├── messages/
│   │   │   │   ├── [conversationId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                    # Route Handlers (webhooks)
│   │   │   └── webhooks/
│   │   │       ├── fedapay/
│   │   │       │   └── route.ts
│   │   │       └── twilio/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx              # Root layout
│   │   ├── not-found.tsx           # Page 404
│   │   ├── error.tsx               # Error boundary global
│   │   ├── loading.tsx             # Loading global
│   │   ├── sitemap.ts              # Sitemap dynamique (SEO)
│   │   └── robots.ts              # Robots.txt (SEO)
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui (genere via CLI)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── property/
│   │   │   ├── property-card.tsx
│   │   │   ├── property-gallery.tsx
│   │   │   ├── property-filters.tsx
│   │   │   ├── property-map.tsx
│   │   │   └── property-search-bar.tsx
│   │   ├── student/
│   │   │   ├── roommate-card.tsx
│   │   │   ├── roommate-profile.tsx
│   │   │   └── expense-split.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   └── payment-table.tsx
│   │   ├── messaging/
│   │   │   ├── chat-window.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   └── conversation-list.tsx
│   │   └── shared/
│   │       ├── rating-stars.tsx
│   │       ├── image-upload.tsx
│   │       ├── verification-badge.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # createBrowserClient (composant client)
│   │   │   ├── server.ts           # createServerClient (Server Components/Actions)
│   │   │   ├── middleware.ts        # Refresh session dans middleware Next.js
│   │   │   └── admin.ts            # Service role client (Edge Functions, webhooks)
│   │   ├── fedapay.ts              # Client FedaPay (cote serveur uniquement)
│   │   ├── twilio.ts               # Client Twilio SMS
│   │   ├── resend.ts               # Client email
│   │   └── utils.ts                # Helpers generiques (cn, formatPrice, etc.)
│   │
│   ├── actions/                    # Next.js Server Actions
│   │   ├── auth.ts                 # signup, login, logout, verifyOTP
│   │   ├── properties.ts           # createProperty, updateProperty, deleteProperty
│   │   ├── search.ts               # searchProperties, searchColocations
│   │   ├── rentals.ts              # applyForRental, signContract, cancelRental
│   │   ├── payments.ts             # initiatePayment, confirmPayment
│   │   ├── messages.ts             # sendMessage, markAsRead
│   │   ├── visits.ts               # requestVisit, confirmVisit, rejectVisit
│   │   ├── ratings.ts              # createRating
│   │   ├── favorites.ts            # toggleFavorite
│   │   ├── profile.ts              # updateProfile, uploadVerificationDocs
│   │   └── students.ts             # requestJoinColocation, voteOnRequest
│   │
│   ├── hooks/
│   │   ├── use-auth.ts             # Hook session utilisateur
│   │   ├── use-realtime-messages.ts # Hook messagerie temps reel
│   │   ├── use-notifications.ts    # Hook notifications
│   │   └── use-geolocation.ts      # Hook position utilisateur
│   │
│   ├── types/
│   │   ├── database.ts             # Types generes par Supabase CLI (supabase gen types)
│   │   ├── properties.ts           # Types metier proprietes
│   │   ├── users.ts                # Types metier utilisateurs
│   │   └── payments.ts             # Types metier paiements
│   │
│   ├── validators/
│   │   ├── property.ts             # Schemas Zod pour proprietes
│   │   ├── auth.ts                 # Schemas Zod pour auth
│   │   ├── payment.ts              # Schemas Zod pour paiements
│   │   └── profile.ts              # Schemas Zod pour profil
│   │
│   └── styles/
│       └── globals.css             # Tailwind directives + variables CSS custom
│
├── supabase/
│   ├── migrations/                 # Migrations SQL (versionees)
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   └── 00003_seed_data.sql
│   ├── functions/                  # Supabase Edge Functions
│   │   ├── generate-contract-pdf/
│   │   │   └── index.ts
│   │   ├── send-notification/
│   │   │   └── index.ts
│   │   └── verify-identity/
│   │       └── index.ts
│   ├── seed.sql                    # Donnees de test
│   └── config.toml                 # Config Supabase locale
│
├── tests/
│   ├── e2e/                        # Tests end-to-end (Playwright)
│   └── unit/                       # Tests unitaires (Vitest)
│
├── .env.local                      # Variables d'environnement (jamais commit)
├── .env.example                    # Template des variables requises
├── next.config.ts                  # Config Next.js
├── tailwind.config.ts              # Config Tailwind
├── tsconfig.json                   # Config TypeScript
├── middleware.ts                   # Middleware Next.js (auth session refresh)
├── components.json                 # Config shadcn/ui
└── package.json
```

---

## 9. Base de Donnees

### PostgreSQL via Supabase

La base utilise le schema SQL defini dans le PRD avec les ajouts suivants :
- **PostGIS** pour les colonnes de localisation (`geography` au lieu de `DECIMAL` lat/lng separes)
- **Row Level Security (RLS)** sur toutes les tables
- **Types generes automatiquement** via `supabase gen types typescript`

### Schema Simplifie

```
users
  ├── id (UUID, PK)
  ├── email, phone, password_hash
  ├── first_name, last_name, profile_photo_url
  ├── role (OWNER | TENANT | STUDENT | ADMIN)
  ├── verification_status (PENDING | APPROVED | REJECTED)
  └── rating_average

properties
  ├── id (UUID, PK)
  ├── owner_id (FK -> users)
  ├── title, description, price
  ├── location (geography, PostGIS)  <- point geo-spatial
  ├── address, property_type, status
  ├── bedrooms, bathrooms, square_meters
  └── amenities (text[])

property_photos
  ├── property_id (FK -> properties)
  ├── photo_url (chemin Supabase Storage)
  └── display_order

roommate_listings        (V1)
  ├── user_id (FK -> users)
  ├── title, description, price
  ├── location (geography)
  ├── people_looking_for
  └── preferred_profile (jsonb)

roommate_groups          (V1)
roommate_members         (V1)

rentals
  ├── property_id (FK -> properties)
  ├── tenant_id (FK -> users)
  ├── start_date, end_date, monthly_rent
  ├── security_deposit, status
  └── contract_url

messages
  ├── sender_id, recipient_id
  ├── property_id (nullable)
  ├── content, is_read
  └── created_at

payments
  ├── rental_id (FK -> rentals)
  ├── user_id (FK -> users)
  ├── amount, payment_method
  ├── transaction_id (reference FedaPay)
  └── status

ratings
  ├── rater_id, rated_user_id
  ├── rental_id
  ├── rating (1-5), comment
  └── created_at

contracts
visit_requests
saved_properties
escrow_payments          (V2)
```

### Row Level Security (RLS)

Chaque table a des politiques RLS basees sur `auth.uid()` :

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | Profil public visible par tous, infos sensibles reservees au proprietaire du compte | Uniquement via auth (signup) | Seulement son propre profil | Admin uniquement |
| `properties` | Annonces `AVAILABLE` visibles par tous | Uniquement si `role = OWNER` et `verification_status = APPROVED` | Seulement ses propres annonces | Seulement ses propres annonces |
| `messages` | Seulement si `sender_id` ou `recipient_id` = user | Utilisateur authentifie | Seulement `is_read` par le destinataire | Non autorise |
| `payments` | Seulement ses propres paiements | Via Server Action (service role) | Via webhook FedaPay (service role) | Non autorise |
| `saved_properties` | Seulement ses propres favoris | Utilisateur authentifie | N/A | Seulement ses propres favoris |

---

## 10. Authentification

### Flux

```
1. Inscription
   Utilisateur -> formulaire (email, telephone, mot de passe, role)
   -> Server Action signup() -> Supabase Auth signUp()
   -> Email de confirmation envoye (Resend)
   -> SMS OTP envoye (Twilio) pour verifier le telephone
   -> Redirection vers page de verification

2. Connexion
   Utilisateur -> formulaire (email + mot de passe)
   -> Server Action login() -> Supabase Auth signInWithPassword()
   -> Session cookie HttpOnly (geree par @supabase/ssr)
   -> Redirection vers dashboard selon role

3. Refresh Session
   middleware.ts intercepte chaque requete
   -> Supabase middleware rafraichit le token si expire
   -> Transparent pour l'utilisateur

4. Verification Identite (post-inscription)
   Utilisateur upload document gouvernemental + selfie
   -> Supabase Storage (bucket prive `kyc/`)
   -> verification_status = PENDING
   -> Admin review manuel (MVP) ou Smile Identity API (V2)
   -> APPROVED -> acces aux fonctionnalites restreintes
```

### Middleware Next.js

```typescript
// middleware.ts
// Protege les routes /owner/*, /tenant/*, /student/*
// Rafraichit la session Supabase sur chaque requete
// Redirige vers /login si non authentifie
// Redirige vers /verify si verification_status != APPROVED
//   (pour les actions restreintes)
```

---

## 11. Paiements Mobile Money

### Architecture FedaPay

```
1. Initiation
   Locataire clique "Payer" -> Server Action initiatePayment()
   -> Cree transaction FedaPay (montant, devise XOF, callback URL)
   -> FedaPay retourne un token + URL de paiement
   -> Redirect vers page de paiement FedaPay (hosted)

2. Paiement
   Locataire choisit operateur (MTN, Moov, etc.)
   -> Saisit son numero Mobile Money
   -> Recoit USSD push sur son telephone
   -> Confirme avec son code PIN

3. Confirmation
   FedaPay envoie webhook POST /api/webhooks/fedapay
   -> Verification signature HMAC
   -> Mise a jour payment.status = COMPLETED
   -> Mise a jour rental.status si besoin
   -> Notification au proprietaire (Supabase Realtime + SMS)
   -> Notification au locataire (email de recu)

4. Fallback
   Si FedaPay est indisponible (circuit breaker)
   -> Basculer vers Kkiapay (widget drop-in)
   -> Meme flux webhook sur /api/webhooks/kkiapay
```

### Operateurs Supportes (Benin)

| Operateur | Provider | Frais |
|-----------|----------|-------|
| MTN Mobile Money | FedaPay | 1.8% |
| Moov Money | FedaPay | ~4% |
| Celtiis Cash | FedaPay | ~4% |
| Coris Money | FedaPay | ~4% |
| BMO | FedaPay | ~4% |
| Visa/Mastercard | FedaPay | 3.6% |

### Exemple d'Integration

```typescript
// src/actions/payments.ts (Server Action)
import FedaPay from 'fedapay';

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY!);
FedaPay.setEnvironment('live'); // 'sandbox' pour dev

export async function createPayment(rentalId: string, amount: number) {
  const transaction = await FedaPay.Transaction.create({
    description: `Loyer KAZA - ${rentalId}`,
    amount: amount,
    currency: { iso: 'XOF' },
    callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/fedapay`,
    customer: {
      firstname: 'Jean',
      lastname: 'Dupont',
      email: 'jean@example.com',
      phone_number: { number: '+22997000000', country: 'bj' }
    }
  });
  return transaction.generateToken();
}
```

---

## 12. Messagerie Temps Reel

### Architecture

```
Client A (navigateur)                    Client B (navigateur)
     |                                        |
     | 1. sendMessage() Server Action         |
     |------> Next.js Server                  |
     |        |                               |
     |        | 2. INSERT INTO messages        |
     |        |------> Supabase PostgreSQL     |
     |        |                               |
     |        |        3. WAL replication      |
     |        |        -----> Supabase Realtime|
     |        |                    |           |
     |        |                    | 4. WebSocket push
     |        |                    |---------->|
     |        |                               |
     | 5. Confirmation (reponse Server Action)|
     |<-------|                               |
```

- Les messages sont persistes dans PostgreSQL (table `messages`)
- Supabase Realtime ecoute le WAL et push les INSERT aux clients abonnes
- RLS garantit que seuls sender et recipient recoivent les messages
- Typing indicators via Supabase Broadcast (ephemere, pas persiste)
- Presence (en ligne/hors ligne) via Supabase Presence

---

## 13. Storage et Images

### Buckets Supabase Storage

| Bucket | Acces | Contenu | Transformations |
|--------|-------|---------|-----------------|
| `property-images` | Public (lecture) | Photos des annonces | Resize, WebP, AVIF via URL params |
| `profile-photos` | Public (lecture) | Avatars utilisateurs | Resize 200x200 |
| `kyc-documents` | Prive (admin only) | Documents d'identite, selfies | Aucune |
| `contracts` | Prive (parties only) | PDF contrats signes | Aucune |
| `roommate-images` | Public (lecture) | Photos des chambres en colocation | Resize, WebP |

### Optimisation Images

Les photos de proprietes passent par deux couches d'optimisation :

1. **Supabase Storage Transforms** : redimensionnement et conversion WebP a l'upload
2. **next/image** : conversion AVIF, `srcset` responsive, lazy loading, cache Vercel Edge

```tsx
// Exemple : affichage d'une photo de propriete
<Image
  src={`${SUPABASE_URL}/storage/v1/object/public/property-images/${photo.path}`}
  alt={property.title}
  width={800}
  height={500}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={photo.blur_hash}
/>
```

---

## 14. Recherche Geo-Spatiale

### PostGIS

La colonne `location` dans `properties` et `roommate_listings` est de type `geography(Point, 4326)` (systeme de coordonnees WGS84).

```sql
-- Index spatial pour performances
CREATE INDEX idx_properties_location ON properties USING GIST (location);

-- Recherche par rayon (5km autour de Cotonou)
SELECT *, ST_Distance(location, ST_MakePoint(2.3912, 6.3703)::geography) AS distance
FROM properties
WHERE status = 'AVAILABLE'
  AND ST_DWithin(location, ST_MakePoint(2.3912, 6.3703)::geography, 5000)
  AND price BETWEEN 50000 AND 200000
  AND bedrooms >= 2
ORDER BY distance ASC
LIMIT 20;
```

### Integration Mapbox

- **Geocoding** : conversion adresse -> coordonnees a la creation d'annonce
- **Carte interactive** : affichage des resultats de recherche sur carte
- **Recherche d'adresses** : autocompletion dans le formulaire de creation
- **Mode offline** : tuiles pre-cachees pour les zones populaires (Cotonou, Porto-Novo)

---

## 15. SEO

Les annonces immobilieres sont la porte d'entree organique principale. Chaque annonce doit etre indexable et partageable.

| Element | Implementation |
|---------|---------------|
| **SSR** | Toutes les pages de listing sont des Server Components (HTML complet) |
| **Metadata dynamique** | `generateMetadata()` par annonce (titre, description, prix, image OG) |
| **Sitemap** | `sitemap.ts` genere dynamiquement a partir des annonces actives |
| **robots.txt** | `robots.ts` avec regles pour crawlers |
| **JSON-LD** | Schema.org `RealEstateListing` sur chaque page de detail |
| **Open Graph** | Image, titre, prix pour previews WhatsApp/Facebook |
| **Canonical URLs** | Eviter le contenu duplique entre recherche et detail |

---

## 16. PWA et Offline

- **@ducanh2912/next-pwa** genere le service worker et le manifest
- Strategie de cache : `stale-while-revalidate` pour les pages, `cache-first` pour les images
- Les annonces recemment consultees sont disponibles offline
- Push notifications via Firebase Cloud Messaging

```json
{
  "name": "KAZA - Immobilier Afrique",
  "short_name": "KAZA",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1A3A52",
  "background_color": "#FFFFFF"
}
```

---

## 17. Internationalisation

- **Langue par defaut** : Francais (fr)
- **Langues futures** : Anglais (en), Fon (fon), Yoruba (yo)
- **Librairie** : next-intl
- **Structure** : fichiers JSON par locale dans `messages/fr.json`, `messages/en.json`
- **Formatage** : prix en XOF (Franc CFA), dates au format francais

---

## 18. Performance et Latence

### Strategie pour compenser la latence Supabase (~200ms depuis le Benin)

| Technique | Cible |
|-----------|-------|
| **Vercel Edge Cache** | Pages statiques et ISR servies depuis l'edge le plus proche |
| **stale-while-revalidate** | L'utilisateur voit les donnees cachees immediatement, revalidation en arriere-plan |
| **next/image CDN** | Images servies depuis le CDN Vercel le plus proche |
| **Optimistic updates** | UI mise a jour immediatement (favoris, messages), synchro en arriere-plan |
| **PWA cache** | Annonces recemment vues disponibles instantanement |
| **Lazy loading** | Composants lourds (carte, galerie) charges a la demande |
| **Skeleton loading** | Feedback visuel immediat pendant le chargement |

---

## 19. Deploiement

### Environnements

| Environnement | Frontend | Backend | Base de Donnees |
|---------------|----------|---------|-----------------|
| **Local** | `next dev` (localhost:3000) | Supabase CLI (`supabase start`) | PostgreSQL local (Docker) |
| **Preview** | Vercel Preview (branche PR) | Supabase projet staging | DB staging |
| **Production** | Vercel Production | Supabase Cloud (eu-central-1) | DB production |

### CI/CD

```
Push sur branche -> Vercel Preview Deploy automatique
                 -> Tests Vitest (unitaires)
                 -> Tests Playwright (e2e)

Merge sur main   -> Vercel Production Deploy
                 -> Supabase migrations appliquees (supabase db push)
```

### Variables d'Environnement

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Jamais expose cote client
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx

FEDAPAY_SECRET_KEY=sk_live_xxx
FEDAPAY_PUBLIC_KEY=pk_live_xxx
FEDAPAY_WEBHOOK_SECRET=whsec_xxx

TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

RESEND_API_KEY=re_xxx

NEXT_PUBLIC_APP_URL=https://kaza.com
```

---

## 20. Tests

| Type | Outil | Cible |
|------|-------|-------|
| **Unitaires** | Vitest | Validators Zod, utils, logique metier |
| **Composants** | Vitest + React Testing Library | Composants UI isoles |
| **Integration** | Vitest + Supabase local | Server Actions avec DB locale |
| **E2E** | Playwright | Parcours utilisateur complets (inscription, recherche, paiement) |

---

# PARTIE III - COUTS ET RISQUES

---

## 21. Estimation des Couts

### Phase MVP (500 utilisateurs)

| Service | Plan | Cout Mensuel |
|---------|------|:------------:|
| Supabase | Free | $0 |
| Vercel | Free (Hobby) | $0 |
| Cloudflare | Free | $0 |
| FedaPay | Pay-per-use | ~$0 (frais sur transactions) |
| Twilio | Pay-per-use | ~$10-20 (SMS OTP) |
| Domaine .com | Annuel | ~$1/mois |
| **TOTAL MVP** | | **~$11-21/mois** |

### Phase V1 (5k utilisateurs)

| Service | Plan | Cout Mensuel |
|---------|------|:------------:|
| Supabase | Pro | $25 |
| Vercel | Pro | $20 |
| Cloudflare | Free | $0 |
| FedaPay | Pay-per-use | ~$0 (1.8% sur chaque transaction) |
| Twilio | Pay-per-use | ~$50-80 |
| Sentry | Team | $26 |
| **TOTAL V1** | | **~$121-151/mois** |

### Phase V2 (50k utilisateurs)

| Service | Plan | Cout Mensuel |
|---------|------|:------------:|
| Supabase | Pro (usage additionnel) | ~$45-80 |
| Vercel | Pro | $20 + ~$50 bandwidth |
| Cloudflare | Pro | $20 |
| FedaPay | Pay-per-use | Commission sur transactions |
| Twilio | Pay-per-use | ~$200-400 |
| Sentry | Team | $26 |
| **TOTAL V2** | | **~$361-596/mois** |

> **Note** : FedaPay preleve 1.8% (MTN) sur chaque transaction de loyer. Ce n'est pas un cout fixe mais un pourcentage sur le volume. A 1000 transactions de 100,000 XOF/mois = ~$300 de frais FedaPay.

---

## 22. Risques et Mitigations

| Risque | Probabilite | Impact | Mitigation |
|--------|:-----------:|:------:|-----------|
| **Latence Supabase depuis Benin** (serveur a Frankfurt, ~200ms) | Haute | Moyen | Cache agressif (Vercel Edge, stale-while-revalidate), images sur CDN, PWA pour offline. Migrer vers self-hosted en Afrique si besoin en V3. |
| **FedaPay downtime** | Moyenne | Haut | Kkiapay en fallback automatique. Pattern circuit-breaker dans l'API. |
| **Supabase Free tier pause** (7 jours inactivite) | Haute (MVP) | Haut | Passer au Pro ($25/mois) des que le produit est en beta ouverte. Cron job de keepalive en attendant. |
| **Recrutement devs Next.js au Benin** | Moyenne | Moyen | React est le framework le plus populaire en Afrique. Next.js est la sur-couche la plus utilisee. Former les devs React existants. |
| **Compliance donnees (RGPD Benin)** | Basse | Haut | Supabase RLS assure le controle d'acces. Politique de donnees claire. Self-hosting possible si requis. |
| **Scalabilite temps reel (messagerie)** | Basse | Moyen | Supabase Realtime gere 224K msg/sec. Suffisant jusqu'a 100K+ users. |

---

## 23. Phases de Developpement

### MVP (Semaines 1-4)

| Semaine | Livrables |
|---------|-----------|
| **S1** | Setup projet, design system (Tailwind + shadcn/ui), composants de base, schema DB + migrations, Supabase Auth |
| **S2** | Landing page, page recherche, page detail propriete, pages login/signup |
| **S3** | Dashboard proprietaire, dashboard locataire, creation annonce, messagerie, favoris |
| **S4** | Integration FedaPay, contrats PDF, notifications email/SMS, PWA, responsive, tests, deploiement |

### V1 - Colocation (Semaines 5-8)

Espace etudiant complet, processus approbation, chat groupe, contrats colocation, paiements groupes.

### V2 - Avance (Semaines 9-12)

Escrow, paiements avances, notations/avis, support chat, PWA complete, analytics dashboard.

---

*Document genere le 19 Mars 2026*
