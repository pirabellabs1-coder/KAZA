## Why

Le projet KAZA n'a actuellement aucun code source. Pour demarrer le developpement du MVP (plateforme immobiliere pan-africaine), il faut poser les fondations techniques : scaffolding du projet Next.js 15+, mise en place du design system (Tailwind CSS v4 + shadcn/ui), creation des composants de base reutilisables, configuration de Supabase (base de donnees, auth, storage), et integration des premieres pages publiques (landing page, recherche, detail propriete, authentification). Sans cette fondation, aucune fonctionnalite metier ne peut etre developpee.

## What Changes

- Creation du projet Next.js 15+ avec App Router, TypeScript, Tailwind CSS v4
- Configuration de shadcn/ui et du design system complet (couleurs, typographie, spacing selon le PRD)
- Creation des composants de base reutilisables : Button, Card, Input, Modal, Navbar, Footer, Sidebar, Skeleton
- Creation des composants metier : PropertyCard, PropertyGallery, PropertyFilters, PropertySearchBar, RatingStars, VerificationBadge, EmptyState, ImageUpload
- Configuration de Supabase : client browser, client serveur, middleware auth, schema SQL initial avec RLS
- Mise en place des pages publiques : Landing Page (Hero + Featured Listings), Page de recherche (Filtres + Grille + Carte), Page detail propriete (Galerie + Infos + Contact), Student Living
- Mise en place des pages d'authentification : Login, Signup, Forgot Password
- Mise en place du layout Dashboard avec sidebar et navigation par role (Proprietaire, Locataire, Etudiant)
- Configuration du middleware Next.js pour la gestion des sessions et la protection des routes
- Configuration PWA de base (manifest.json, service worker)
- Configuration SEO (sitemap dynamique, robots.txt, metadata)
- Mise en place des validateurs Zod pour les schemas de donnees
- Configuration de l'internationalisation (next-intl, francais par defaut)

## Capabilities

### New Capabilities
- `project-setup`: Configuration initiale du projet Next.js 15+, Tailwind CSS v4, TypeScript, structure des dossiers, variables d'environnement, middleware
- `design-system`: Design system complet avec variables CSS, composants shadcn/ui configures, typographie Inter/Poppins, palette de couleurs Navy Blue, responsive breakpoints
- `base-components`: Composants UI reutilisables (Navbar, Footer, Sidebar, PropertyCard, PropertyFilters, PropertySearchBar, PropertyGallery, RatingStars, ImageUpload, VerificationBadge, EmptyState)
- `public-pages`: Pages publiques du MVP (Landing Page avec Hero et Featured Listings, page recherche avec filtres et grille, page detail propriete avec galerie et reviews, page Student Living)
- `auth-pages`: Pages d'authentification (Login, Signup, Forgot Password) avec formulaires valides par Zod
- `dashboard-layout`: Layout dashboard avec sidebar, navigation par role (Proprietaire/Locataire/Etudiant), header, et protection des routes
- `supabase-config`: Configuration Supabase (clients browser/serveur, middleware auth, schema SQL initial avec tables users/properties/property_photos/rentals/messages/payments/ratings/contracts/visit_requests/saved_properties, RLS policies, indexes PostGIS)

### Modified Capabilities
<!-- Aucune capability existante a modifier - projet vierge -->

## Impact

- **Code** : Creation complete de l'arborescence `src/` (app, components, lib, actions, hooks, types, validators, styles)
- **Base de donnees** : Schema SQL initial avec 12+ tables, indexes de performance, politiques RLS
- **Dependances** : Next.js 15+, React 19, Tailwind CSS v4, shadcn/ui, @supabase/ssr, Zod, React Hook Form, Zustand, Mapbox GL JS, next-intl, next-pwa
- **Infrastructure** : Configuration Vercel-ready (next.config.ts), Supabase migrations, variables d'environnement
- **SEO** : Sitemap dynamique, robots.txt, metadata par page, JSON-LD pour annonces
