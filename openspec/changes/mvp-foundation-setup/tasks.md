## 1. Scaffolding du projet

- [x] 1.1 Initialiser le projet Next.js 15+ avec App Router, TypeScript strict, et Tailwind CSS v4 (`npx create-next-app@latest`)
- [x] 1.2 Installer les dependances : @supabase/ssr, @supabase/supabase-js, react-hook-form, @hookform/resolvers, zod, zustand, next-intl, @ducanh2912/next-pwa, lucide-react
- [x] 1.3 Configurer shadcn/ui (init + composants de base : button, card, input, dialog, select, skeleton, badge, avatar, tabs, separator, dropdown-menu, sheet, tooltip)
- [x] 1.4 Creer l'arborescence complete des dossiers selon ARCHITECTURE.md section 8 (src/app/, src/components/, src/lib/, src/actions/, src/hooks/, src/types/, src/validators/, src/styles/, supabase/migrations/, supabase/functions/)
- [x] 1.5 Configurer les alias TypeScript (`@/` → `src/`) dans tsconfig.json
- [x] 1.6 Creer le fichier .env.example avec toutes les variables documentees (Supabase, FedaPay, Twilio, Mapbox, Resend)
- [x] 1.7 Mettre a jour .gitignore pour exclure .env.local, node_modules, .next, supabase/.temp

## 2. Design system et styles globaux

- [x] 2.1 Configurer les polices Inter et Poppins via next/font dans le root layout
- [x] 2.2 Definir les CSS variables dans globals.css : palette de couleurs PRD (primaires, accents, neutres, statuts, degradess)
- [x] 2.3 Surcharger les CSS variables de shadcn/ui pour correspondre a la palette KAZA (Navy Blue, Accent Blue)
- [x] 2.4 Configurer Tailwind avec les valeurs custom du PRD (spacing xs-3xl, font sizes, font weights, line heights)
- [x] 2.5 Forcer le mode clair uniquement (desactiver le dark mode dans la config shadcn/ui et Tailwind)
- [x] 2.6 Definir les breakpoints responsives (mobile < 768px, tablet 768-1024px, desktop > 1024px) et les classes utilitaires

## 3. Composants layout

- [x] 3.1 Creer le composant Navbar (64px, sticky, logo, menu navigation, boutons auth, hamburger mobile avec Sheet)
- [x] 3.2 Creer le composant Footer (4 colonnes desktop, 2 tablette, 1 mobile : logo+description, liens rapides, liens legaux, contact)
- [x] 3.3 Creer le composant Sidebar dashboard (280px, navigation par role, lien actif distinct, collapsable mobile)
- [x] 3.4 Creer le composant MobileNav (drawer lateral pour la navigation mobile)

## 4. Composants metier

- [x] 4.1 Creer le composant PropertyCard (image 200px, badge prix #1976D2, bouton favori coeur, titre, localisation, specs, hover scale 1.02)
- [x] 4.2 Creer le composant PropertySearchBar (champ localisation, selecteur prix, bouton rechercher)
- [x] 4.3 Creer le composant PropertyFilters (sidebar 280px desktop / drawer mobile, filtres prix/type/chambres/localisation, bouton Appliquer)
- [x] 4.4 Creer le composant PropertyGallery (image principale pleine largeur, thumbnails carrousel, controles prev/next)
- [x] 4.5 Creer le composant RatingStars (1-5 etoiles, demi-etoiles, mode lecture et interactif)
- [x] 4.6 Creer le composant RoommateCard (image chambre, prix, localisation, nb colocataires, bouton "Demander a rejoindre")
- [x] 4.7 Creer le composant VerificationBadge (vert verifie, orange en attente, absent non verifie)
- [x] 4.8 Creer le composant EmptyState (illustration, titre, description, bouton action optionnel)
- [x] 4.9 Creer le composant ImageUpload (drag-and-drop, apercu miniatures, max 10 images, barre progression)
- [x] 4.10 Creer le composant StatsCard pour les dashboards (icone, titre, valeur, variation)

## 5. Donnees mockees et types

- [x] 5.1 Creer le fichier src/lib/mock-data.ts avec les donnees de test (5 users, 10 proprietes avec photos, 3 colocations, avis)
- [x] 5.2 Creer les types TypeScript metier dans src/types/ (properties.ts, users.ts, payments.ts) alignes sur le schema SQL du PRD
- [x] 5.3 Creer les schemas de validation Zod dans src/validators/ (auth.ts, property.ts, profile.ts)

## 6. Configuration Supabase

- [x] 6.1 Creer les clients Supabase : client.ts (browser), server.ts (Server Components/Actions), admin.ts (service role), middleware.ts (refresh session)
- [x] 6.2 Creer la migration initiale SQL (00001_initial_schema.sql) avec toutes les tables du PRD, extensions PostGIS et pg_trgm, colonnes geography, et contraintes
- [x] 6.3 Creer la migration RLS (00002_rls_policies.sql) avec les politiques de securite pour chaque table selon ARCHITECTURE.md section 9
- [x] 6.4 Creer le fichier de seed (00003_seed_data.sql / seed.sql) avec les donnees de test
- [x] 6.5 Creer les indexes de performance (spatial GIST, owner_id, status, sender_id, recipient_id, etc.)
- [x] 6.6 Configurer supabase/config.toml pour le developpement local

## 7. Middleware et internationalisation

- [x] 7.1 Creer le middleware Next.js (middleware.ts) : refresh session Supabase, protection routes /owner/*, /tenant/*, /student/*, /dashboard/*, /profile/*, /settings/*, /messages/*, redirection vers /login avec parametre redirect
- [x] 7.2 Configurer next-intl avec le francais comme locale par defaut, creer messages/fr.json avec les traductions initiales
- [x] 7.3 Configurer le root layout (src/app/layout.tsx) avec polices, metadata par defaut, providers (NextIntlClientProvider)

## 8. Pages d'authentification

- [x] 8.1 Creer le layout auth (src/app/(auth)/layout.tsx) : layout minimal centre avec logo KAZA
- [x] 8.2 Creer la page Login (src/app/(auth)/login/page.tsx) : formulaire email/password, validation Zod, Server Action, redirection post-login
- [x] 8.3 Creer la page Signup (src/app/(auth)/signup/page.tsx) : formulaire complet (prenom, nom, email, telephone, password, role), validation Zod, Server Action
- [x] 8.4 Creer la page Forgot Password (src/app/(auth)/forgot-password/page.tsx) : formulaire email, Server Action reset password
- [x] 8.5 Creer les Server Actions auth (src/actions/auth.ts) : signup, login, logout, forgotPassword (connexion Supabase Auth)

## 9. Pages publiques

- [x] 9.1 Creer le layout main (src/app/(main)/layout.tsx) avec Navbar + Footer
- [x] 9.2 Creer la Landing Page (src/app/(main)/page.tsx) : Hero 500px avec overlay + search bar, Featured Listings 4 cards, Student Section, How Kaza Works 2 colonnes
- [x] 9.3 Creer la page Search Results (src/app/(main)/search/page.tsx) : header compteur + toggle vue, layout 2 colonnes (filtres + grille), pagination
- [x] 9.4 Creer la page Property Detail (src/app/(main)/properties/[id]/page.tsx) : galerie, infos 2 colonnes, proprietes similaires, section avis, metadata SEO + JSON-LD
- [x] 9.5 Creer la page Properties listing (src/app/(main)/properties/page.tsx) : grille de toutes les proprietes disponibles
- [x] 9.6 Creer la page Student Living (src/app/(main)/student-living/page.tsx) : Hero etudiant, filtres, grille RoommateCards
- [x] 9.7 Creer la page Student Living Detail (src/app/(main)/student-living/[id]/page.tsx) : detail colocation, colocataires anonymes, bouton "Demander a rejoindre"
- [x] 9.8 Creer la page About (src/app/(main)/about/page.tsx) : mission KAZA, description, formulaire contact
- [x] 9.9 Creer la page 404 (src/app/not-found.tsx) : message clair + lien retour accueil

## 10. Layout et pages dashboard

- [x] 10.1 Creer le layout dashboard (src/app/(dashboard)/layout.tsx) avec Sidebar + Header (nom utilisateur, avatar, deconnexion)
- [x] 10.2 Creer la page de redirection dashboard (src/app/(dashboard)/dashboard/page.tsx) : redirection selon role
- [x] 10.3 Creer les pages espace proprietaire : properties (liste + new + [id]), visits, rentals, payments, analytics - avec contenu placeholder
- [x] 10.4 Creer les pages espace locataire : saved, rentals, payments, messages - avec contenu placeholder
- [x] 10.5 Creer les pages espace etudiant : colocations, requests, expenses, chat - avec contenu placeholder
- [x] 10.6 Creer la page Messages (src/app/(dashboard)/messages/page.tsx et [conversationId]/page.tsx) avec layout conversation placeholder
- [x] 10.7 Creer la page Profile (src/app/(dashboard)/profile/page.tsx) : affichage et edition des informations utilisateur
- [x] 10.8 Creer la page Settings (src/app/(dashboard)/settings/page.tsx) : modification mot de passe, notifications, suppression compte

## 11. SEO et PWA

- [x] 11.1 Creer src/app/sitemap.ts generant un sitemap dynamique des pages publiques et annonces
- [x] 11.2 Creer src/app/robots.ts avec les regles de crawling
- [x] 11.3 Ajouter generateMetadata() avec Open Graph sur les pages Property Detail (titre, description, image, prix)
- [x] 11.4 Ajouter JSON-LD Schema.org RealEstateListing sur les pages Property Detail
- [x] 11.5 Configurer le manifest.json PWA (nom KAZA, theme #1A3A52, standalone) et next-pwa dans next.config.ts

## 12. Verification et tests visuels

- [ ] 12.1 Verifier la responsivite de toutes les pages avec playwright-skill (mobile 375px, tablette 768px, desktop 1280px)
- [ ] 12.2 Verifier la navigation complete : Landing → Recherche → Detail → Auth → Dashboard → Profil
- [ ] 12.3 Verifier le design system : coherence des couleurs, typographies, spacings sur toutes les pages
- [ ] 12.4 Corriger les bugs visuels et d'accessibilite identifies lors des tests
