## Context

Le projet KAZA part de zero : seuls le PRD et le document d'architecture existent. L'objectif est de poser toutes les fondations techniques du MVP en une phase coherente afin que les fonctionnalites metier (messagerie, paiements, contrats) puissent etre developpees par-dessus sans restructuration.

Le contexte africain impose des contraintes fortes : bande passante limitee (2G/3G), appareils mid-range (2-3 Go RAM), Mobile Money comme standard de paiement, et SEO critique car la decouverte se fait via Google et partage WhatsApp/Facebook. Ces contraintes guident chaque decision technique.

Le document d'architecture (ARCHITECTURE.md) a deja valide les choix principaux : Next.js 15+, Supabase, FedaPay, Tailwind CSS v4 + shadcn/ui. Cette phase de fondation les met en oeuvre.

## Goals / Non-Goals

**Goals:**
- Scaffolder le projet Next.js 15+ avec une structure de dossiers conforme a ARCHITECTURE.md section 8
- Mettre en place le design system complet (variables CSS, composants shadcn/ui, typographie, couleurs) conforme au PRD section "Design System & Maquettes"
- Creer tous les composants de base reutilisables documentes dans le PRD section "Composants Reutilisables"
- Configurer Supabase : schema SQL initial avec PostGIS, RLS policies, clients TypeScript (browser + serveur + admin)
- Implementer les pages publiques avec SSR (Landing, Recherche, Detail Propriete, Student Living)
- Implementer les pages d'authentification (Login, Signup, Forgot Password)
- Mettre en place le layout Dashboard avec navigation par role
- Configurer le middleware Next.js pour auth, refresh session, protection des routes
- Assurer la responsivite mobile-first sur tous les ecrans
- Configurer SEO (metadata dynamique, sitemap, robots.txt, Open Graph)
- Configurer PWA de base (manifest, service worker)

**Non-Goals:**
- Integration des paiements FedaPay/Kkiapay (change separee)
- Messagerie temps reel avec Supabase Realtime (change separee)
- Generation de contrats PDF (change separee)
- Systeme de notifications SMS/email (change separee)
- Module colocation etudiant complet (V1)
- Systeme d'escrow (V2)
- Integration Mapbox complete avec geocoding (seul le placeholder de carte est inclus)
- Deploiement en production (Vercel + Supabase Cloud)
- Tests E2E Playwright (valides manuellement avec playwright-skill apres chaque page)

## Decisions

### D1 : Structure App Router avec Route Groups

**Decision** : Utiliser 3 route groups Next.js : `(auth)`, `(main)`, `(dashboard)`

**Raison** : Chaque groupe a son propre layout. Les pages publiques `(main)` ont Navbar + Footer. Les pages auth `(auth)` ont un layout minimal centre. Le dashboard `(dashboard)` a Sidebar + Header. Les route groups permettent cette separation sans impacter les URLs.

**Alternative consideree** : Layout unique avec conditionnels → rejete car complexe et fragile.

### D2 : shadcn/ui avec customisation via CSS variables

**Decision** : Installer shadcn/ui et surcharger ses CSS variables pour correspondre a la palette KAZA (Navy Blue #1A3A52, Accent Blue #1976D2, etc.)

**Raison** : shadcn/ui fournit des composants accessibles (Radix UI) et customisables. Plutot que de creer un design system from scratch, on adapte shadcn/ui aux couleurs et typographies du PRD. Les composants sont copies dans `src/components/ui/` et restent modifiables.

**Alternative consideree** : Composants 100% custom → rejete car trop lent pour le MVP (4 semaines).

### D3 : Supabase client architecture avec @supabase/ssr

**Decision** : Trois clients Supabase distincts :
- `lib/supabase/client.ts` : `createBrowserClient` pour les composants client
- `lib/supabase/server.ts` : `createServerClient` pour les Server Components et Server Actions
- `lib/supabase/admin.ts` : client service_role pour les webhooks et Edge Functions

**Raison** : `@supabase/ssr` gere correctement les cookies dans l'App Router de Next.js 15+. Le client service_role n'est jamais expose cote navigateur.

### D4 : Schema SQL avec PostGIS des le depart

**Decision** : Inclure l'extension PostGIS et les colonnes `geography(Point, 4326)` dans la migration initiale, meme si la recherche geo-spatiale complete n'est pas dans cette phase.

**Raison** : Modifier le type de colonne plus tard (de `DECIMAL lat/lng` a `geography`) necessiterait une migration de donnees. Mieux vaut commencer avec le bon type. L'index GIST est cree mais la recherche par rayon sera activee dans une change separee.

### D5 : Donnees statiques mockees pour les pages publiques

**Decision** : Les pages publiques (Landing, Recherche, Detail) utilisent des donnees mockees statiques pour cette phase. Les Server Components fetchen depuis un fichier `lib/mock-data.ts` qui simule la structure des reponses Supabase.

**Raison** : Permet de developper et valider les pages frontend independamment de la base de donnees. Le remplacement par des vrais appels Supabase sera transparent car les types TypeScript sont identiques (generes par `supabase gen types`).

**Alternative consideree** : Connecter Supabase des le depart → possible mais ralentit le developpement frontend car chaque page depend du seeding de la DB.

### D6 : Validation formulaires avec React Hook Form + Zod

**Decision** : Tous les formulaires utilisent React Hook Form avec resolvers Zod. Les schemas Zod sont dans `src/validators/` et sont reutilises cote serveur dans les Server Actions.

**Raison** : Validation unique (DRY) partagee entre client et serveur. Zod s'integre nativement avec TypeScript pour l'inference des types.

### D7 : Internationalisation avec next-intl des le depart

**Decision** : Configurer next-intl avec le francais comme locale par defaut. Toutes les chaines de texte passent par les fichiers de traduction `messages/fr.json`.

**Raison** : Ajouter l'i18n apres coup est tres couteux (retrouver et extraire toutes les chaines hardcodees). Le surcout initial est minimal.

## Risks / Trade-offs

**[Taille de la phase]** : Cette phase est consequente (setup + design system + composants + pages + DB).
→ Mitigation : Les taches sont decoupees en sous-taches independantes. Le mock data permet de paralliliser frontend et DB setup.

**[Donnees mockees]** : Les pages avec mock data devront etre reconnectees a Supabase.
→ Mitigation : Les types TypeScript des mocks sont identiques aux types generes par Supabase. Le remplacement est un changement d'import, pas de restructuration.

**[shadcn/ui customisation]** : La palette KAZA differe des defaults de shadcn/ui, certains composants pourraient ne pas bien s'adapter.
→ Mitigation : Les composants sont copies localement et entierement modifiables. Les CSS variables permettent un theming global.

**[PostGIS sur Supabase Free tier]** : L'extension PostGIS est disponible sur le free tier mais les performances peuvent etre limitees.
→ Mitigation : Pour le MVP (500 users), le free tier est suffisant. Migration vers Pro ($25/mois) des la beta ouverte.

**[Latence Supabase depuis le Benin]** : Le serveur Supabase est a Frankfurt (~200ms de latence).
→ Mitigation : SSR via Vercel Edge reduit l'impact. Cache agressif (stale-while-revalidate). Les images passent par le CDN Vercel. PWA pour offline.
