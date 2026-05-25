## ADDED Requirements

### Requirement: Supabase clients SHALL be properly configured
Le projet MUST avoir 3 clients Supabase distincts :
- `lib/supabase/client.ts` : `createBrowserClient` pour les composants client
- `lib/supabase/server.ts` : `createServerClient` pour les Server Components et Server Actions (utilise les cookies Next.js)
- `lib/supabase/admin.ts` : client avec `service_role` key pour les webhooks et operations admin
Le `service_role` key MUST ne jamais etre expose cote client.

#### Scenario: Client browser
- **WHEN** un composant client importe `createBrowserClient` depuis `@/lib/supabase/client`
- **THEN** il obtient un client Supabase configure avec les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Scenario: Client serveur
- **WHEN** un Server Component ou Server Action importe `createServerClient` depuis `@/lib/supabase/server`
- **THEN** il obtient un client Supabase avec gestion des cookies pour l'authentification

#### Scenario: Protection du service role
- **WHEN** le code source est analyse
- **THEN** la variable `SUPABASE_SERVICE_ROLE_KEY` n'est jamais utilisee dans des fichiers marques `"use client"`

### Requirement: Database schema SHALL include all MVP tables
La migration initiale MUST creer les tables suivantes avec les colonnes definies dans le PRD section "Base de Donnees - Schema" : `users`, `properties`, `property_photos`, `roommate_listings`, `roommate_groups`, `roommate_members`, `rentals`, `messages`, `payments`, `escrow_payments`, `ratings`, `contracts`, `visit_requests`, `saved_properties`.

#### Scenario: Migration initiale
- **WHEN** `supabase db push` est execute
- **THEN** toutes les tables sont creees avec leurs colonnes, types, et contraintes de cles etrangeres

#### Scenario: PostGIS active
- **WHEN** la migration s'execute
- **THEN** l'extension PostGIS est activee et les colonnes `location` dans `properties` et `roommate_listings` sont de type `geography(Point, 4326)`

### Requirement: RLS policies SHALL protect all tables
Chaque table MUST avoir des politiques Row Level Security (RLS) activees. Les regles MUST suivre le tableau RLS defini dans ARCHITECTURE.md section 9 : les annonces disponibles sont visibles par tous, les messages sont limites a l'expediteur et au destinataire, les paiements sont visibles uniquement par l'utilisateur concerne, les proprietes ne peuvent etre creees que par des proprietaires verifies.

#### Scenario: Annonces publiques
- **WHEN** un utilisateur non authentifie interroge la table `properties`
- **THEN** seules les proprietes avec `status = AVAILABLE` sont retournees

#### Scenario: Messages prives
- **WHEN** un utilisateur authentifie interroge la table `messages`
- **THEN** seuls les messages ou il est `sender_id` ou `recipient_id` sont retournes

#### Scenario: Creation propriete restreinte
- **WHEN** un utilisateur avec `role != OWNER` ou `verification_status != APPROVED` tente d'inserer dans `properties`
- **THEN** l'insertion est refusee par RLS

### Requirement: Database indexes SHALL optimize common queries
La migration MUST creer les indexes de performance : `idx_properties_owner_id`, `idx_properties_status`, `idx_properties_location` (GIST pour PostGIS), `idx_rentals_tenant_id`, `idx_rentals_property_id`, `idx_messages_sender_id`, `idx_messages_recipient_id`, `idx_ratings_rater_id`, `idx_roommate_members_group_id`.

#### Scenario: Recherche par localisation performante
- **WHEN** une requete `ST_DWithin` est executee sur la table `properties`
- **THEN** l'index GIST spatial est utilise (verifiable via `EXPLAIN ANALYZE`)

### Requirement: Seed data SHALL populate test content
Le fichier `supabase/seed.sql` MUST inserer des donnees de test : au moins 5 utilisateurs (1 admin, 2 proprietaires, 1 locataire, 1 etudiant), au moins 10 proprietes avec photos, et au moins 3 annonces colocation.

#### Scenario: Donnees de test
- **WHEN** `supabase db seed` est execute
- **THEN** les donnees de test sont inserees et les pages publiques peuvent afficher du contenu

### Requirement: TypeScript types SHALL be generated from database schema
Les types TypeScript MUST etre generables via `supabase gen types typescript` et stockes dans `src/types/database.ts`. Ces types MUST etre utilises dans tous les composants et actions pour garantir la coherence avec le schema.

#### Scenario: Generation des types
- **WHEN** le developpeur execute `supabase gen types typescript --local > src/types/database.ts`
- **THEN** un fichier TypeScript contenant les types de toutes les tables est genere
