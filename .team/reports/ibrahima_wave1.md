# Ibrahima — Wave 1 : Espace Admin KAZA

**Date :** 25 mai 2026
**Auteur :** Ibrahima Sow (Senior UI/UX Designer & dev)
**Statut :** Livré

## Fichiers créés (13)

### Layout & pages
- `src/app/(admin)/layout.tsx` — layout principal admin avec sidebar 260px desktop, header sticky 64px, Sheet drawer mobile, fond `bg-gray-50`. Garde de route best-effort via Supabase (vérifie `users.role === 'ADMIN'`), fallback silencieux en dev avec `TODO sécurité Nia`.
- `src/app/(admin)/admin/page.tsx` — Dashboard : titre + date, 4 StatsCard (Utilisateurs, Annonces, Revenus 30j, Litiges), timeline 8 événements, table preview 5 annonces à modérer avec lien "Voir tout".
- `src/app/(admin)/admin/properties/page.tsx` — Modération : 3 filtres (statut/ville/type) + recherche, DataTable 12 lignes mockées, modal de confirmation avec champ raison obligatoire (≥ 3 caractères) si rejet.
- `src/app/(admin)/admin/users/page.tsx` — Gestion utilisateurs : 3 filtres (rôle/statut/vérification), DataTable 12 utilisateurs, action contextuelle Suspendre/Réactiver selon état actuel.
- `src/app/(admin)/admin/verifications/page.tsx` — KYC : tabs (En attente/Approuvées/Rejetées) avec compteurs, grille de cartes (1/2/3 cols) avec placeholders recto/verso/selfie, modal de confirmation.
- `src/app/(admin)/admin/disputes/page.tsx` — Litiges : 4 StatsCard (Ouverts, En traitement, Résolus 30j, Délai moyen), 2 filtres, DataTable 10 litiges avec badges typés (Paiement rouge / Visite bleu / Annonce ambre / Comportement violet).
- `src/app/(admin)/admin/settings/page.tsx` — Paramètres : 5 onglets (Général, Paiements, Notifications, Modération, Maintenance) avec bouton "Enregistrer" par onglet (`console.log` pour l'instant).

### Composants partagés
- `src/components/admin/sidebar.tsx` — sidebar fixe avec 6 items + badges compteur (12, 8, 3), logo KAZA + sous-titre "Admin", badge utilisateur en bas avec bouton déconnexion.
- `src/components/admin/header.tsx` — header sticky avec barre de recherche globale, cloche notif (badge `5`), dropdown avatar, hamburger mobile ouvrant la sidebar en Sheet.
- `src/components/admin/stats-grid.tsx` — wrapper grid responsive (1/2/4 cols) acceptant `<StatsCard />`.
- `src/components/admin/data-table.tsx` — DataTable maison (pas tanstack) : colonnes typées avec `render` + `sortValue`, tri click-header, recherche avec `searchAccessor`, pagination 10/page, état vide via `<EmptyState />`.
- `src/components/admin/status-badge.tsx` — Badge avec 11 statuts mappés (pending orange, approved/active/resolved/published vert, rejected rouge, suspended/closed gris, in_progress bleu, draft gris) + point coloré.

## Choix de design notables

- **Palette respectée :** Navy `#1A3A52` pour titres et items actifs sidebar, Blue `#1976D2` pour accents (badges sidebar, focus), Green `#4CAF50` pour validations/actions positives, Error `#F44336` pour destructives. Aucun mode sombre.
- **Typographie :** `font-heading` (Poppins) sur les H1 des pages, Inter par défaut.
- **DataTable indépendant de tanstack** comme demandé — API simple `{ columns, rows, filters? }`, tri par colonne via `sortValue`, recherche par `searchAccessor`. Pagination locale à 10. État vide réutilise `<EmptyState />` partagé.
- **Toggle custom** dans `settings/page.tsx` car shadcn `Switch` non installé — switch accessible (`role="switch"`, `aria-checked`), sans nouvelle dépendance.
- **Garde de route robuste mais souple :** essaie Supabase si `NEXT_PUBLIC_SUPABASE_URL` est défini, sinon rend avec mock (Aïcha Diop). Permet de bosser en local sans backend. Cast `{ role?: string }` ajouté pour contourner le bug global de typage Supabase qui résout `data` en `never` (à corriger par Aminata quand les types seront régénérés).
- **Badges de rôle utilisateur** colorés distinctement (Propriétaire bleu, Locataire violet, Étudiant teal, Admin navy) pour scan visuel rapide.
- **Filtres sticky en haut de chaque DataTable** alignés à droite, recherche à gauche — pattern unifié sur les 3 pages avec listes.
- **Modal de rejet** : bouton Rejeter désactivé tant que le motif n'a pas ≥ 3 caractères, avec micro-feedback inline. Variante `destructive` du Button.
- **Mobile :** sidebar disparaît `< lg` (1024px), remplacée par Sheet drawer ouvert par hamburger, grille KYC passe à 1 col, DataTables scrollent horizontalement, filtres se réorganisent en colonne.
- **Notifications header :** badge rouge sur la cloche (max "9+"), Notifications mockées à 5.

## Données

Toutes les pages mockent leurs arrays au top du fichier. Aucune dépendance ajoutée. Aucun appel Supabase pour les listes — Aminata branchera ses queries quand elles seront prêtes. Les boutons Approuver/Rejeter/Suspendre font `console.log` côté serveur fictif.

## Vérification

- `tsc --noEmit` : **0 erreur** sur les 13 fichiers créés (vérifié après filtrage des erreurs pré-existantes liées aux types Supabase et résolution `next/*` du projet).
- ESLint : config Next.js cassée globalement (`Cannot find module 'next/dist/compiled/babel-packages'`) — pré-existant, non lié à cette PR.

## Points laissés ouverts (pour les coéquipiers)

- `// TODO sécurité Nia: activer guard quand DB live` dans `(admin)/layout.tsx` — câblage final garde rôle ADMIN.
- Persistance des paramètres (`settings/page.tsx`) à brancher sur Server Actions une fois la table `platform_settings` créée.
- Actions Approuver/Rejeter/Suspendre à brancher sur Server Actions Aminata (`src/actions/admin.ts` à créer).
- Photos d'annonces mockées pointent vers `/images/properties/pX.jpg` (Next/Image avec `unoptimized`) — placeholders à fournir par l'équipe assets.
