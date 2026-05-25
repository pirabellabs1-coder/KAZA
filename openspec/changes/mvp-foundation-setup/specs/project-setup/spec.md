## ADDED Requirements

### Requirement: Project SHALL use Next.js 15+ with App Router
Le projet MUST utiliser Next.js 15+ avec l'App Router, TypeScript strict, et React 19. La configuration MUST inclure les alias de chemin (`@/` pour `src/`).

#### Scenario: Initialisation du projet
- **WHEN** le developpeur clone le repository et execute `npm install && npm run dev`
- **THEN** le serveur de developpement demarre sur localhost:3000 sans erreur

#### Scenario: TypeScript strict
- **WHEN** le code contient une erreur de typage
- **THEN** `npm run build` echoue avec un message d'erreur TypeScript clair

### Requirement: Project structure SHALL match architecture specification
L'arborescence des dossiers MUST correspondre a la structure definie dans ARCHITECTURE.md section 8, avec les dossiers `src/app/`, `src/components/`, `src/lib/`, `src/actions/`, `src/hooks/`, `src/types/`, `src/validators/`, `src/styles/`, et `supabase/`.

#### Scenario: Structure des dossiers
- **WHEN** le projet est scaffolde
- **THEN** tous les dossiers de l'arborescence ARCHITECTURE.md section 8 existent

### Requirement: Environment variables SHALL be properly configured
Le fichier `.env.example` MUST lister toutes les variables d'environnement requises. Les variables prefixees `NEXT_PUBLIC_` sont les seules accessibles cote client. Le `.gitignore` MUST exclure `.env.local`.

#### Scenario: Variables d'environnement documentees
- **WHEN** le developpeur consulte `.env.example`
- **THEN** toutes les variables necessaires (Supabase, FedaPay, Twilio, Mapbox, Resend) sont listees avec des commentaires explicatifs

#### Scenario: Protection des secrets
- **WHEN** le code source est commit
- **THEN** aucun fichier `.env.local` n'est inclus dans le repository

### Requirement: Middleware SHALL handle auth session refresh
Le middleware Next.js (`middleware.ts`) MUST intercepter chaque requete pour rafraichir la session Supabase via `@supabase/ssr`. Les routes protegees (`/owner/*`, `/tenant/*`, `/student/*`, `/dashboard/*`, `/profile/*`, `/settings/*`, `/messages/*`) MUST rediriger vers `/login` si l'utilisateur n'est pas authentifie.

#### Scenario: Utilisateur non authentifie sur route protegee
- **WHEN** un utilisateur non connecte accede a `/owner/properties`
- **THEN** il est redirige vers `/login` avec un parametre `redirect` preservant l'URL d'origine

#### Scenario: Session expiree rafraichie
- **WHEN** un utilisateur authentifie avec un token expire accede a une page
- **THEN** le middleware rafraichit le token silencieusement sans redirection

### Requirement: PWA manifest SHALL be configured
Le fichier `public/manifest.json` MUST configurer l'application comme PWA avec le nom "KAZA", la couleur theme #1A3A52, et le mode `standalone`.

#### Scenario: Installation PWA
- **WHEN** un utilisateur accede a KAZA depuis un navigateur mobile compatible
- **THEN** il peut installer l'application comme PWA avec l'icone et le nom KAZA

### Requirement: SEO configuration SHALL include sitemap and robots
Le projet MUST inclure `src/app/sitemap.ts` generant un sitemap dynamique et `src/app/robots.ts` configurant les regles de crawling.

#### Scenario: Sitemap accessible
- **WHEN** un crawler accede a `/sitemap.xml`
- **THEN** il recoit un sitemap XML valide listant les pages publiques
