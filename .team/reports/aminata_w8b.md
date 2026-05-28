# Aminata Traoré — Wave 8B — Pages owner manquantes

## Fichiers créés

- `src/app/(dashboard)/owner/tenants/page.tsx` — Client component. Onglets de filtre (Actuels / Passés / Tous) via `Tabs`, recherche temps réel par nom ou propriété. 6 locataires mockés (Bénin/Togo/Ghana) avec `ui-avatars` (background `#1A3A52`). Layout dual : table desktop (`md:block`) avec colonnes Avatar+Nom, Propriété, Loyer, Période, Statut Badge, Note (RatingStars + valeur), Actions (Eye → `/profile?u=...`, MessageSquare → toast); cards mobile groupant les mêmes infos. Bouton header "Inviter un locataire" → toast info. `EmptyState` (icon Users) si filtre vide.
- `src/app/(dashboard)/owner/documents/page.tsx` — Client component. 4 sections : (1) **Templates** : 3 cards (Standard avec badge "Populaire", Meublé, Saisonnier) avec boutons Personnaliser/Télécharger (toast). (2) **EDL** : liste 5 items avec ClipboardCheck icon, badge Entrée (vert) / Sortie (warning), bouton "Nouvel EDL" en header. (3) **Documents légaux** : grille 2 colonnes, 4 cards (Attestation, Quittances, Reçus fiscaux=manquant, Assurance) avec badge "À jour"/"Manquant" et boutons Téléverser/Voir. (4) **Archives** : liste compacte 8 fichiers (factures/rapports/échanges) avec date FR et taille.
- `src/app/(dashboard)/owner/reports/page.tsx` — Client component. 4 sections : (1) **Export comptable** : `Select` période (Ce mois / Trimestre / Année) qui pilote 3 grandes cards (Revenus, Charges, Bénéfice net) avec `DeltaPill` (TrendingUp/Down) et borders gauche colorées; bouton "Télécharger PDF" (toast). (2) **Performance des annonces** : table desktop / liste mobile avec 6 biens (photos `picsum.photos/seed/...` via `next/image` + `unoptimized`), conversion calculée (`requests/views*100`) avec Badge coloré (vert ≥3%, ambre ≥1.5%, rose <1.5%). (3) **Rapports fiscaux** : grille 3 cols mobile / 4 cols desktop sur 12 mois, chaque card avec mois + revenus + bouton "PDF". (4) **Insights** : 3 cards conseils (hausse prix Fidjrossè, temps de réponse, photos Cadjehoun) avec icônes colorées (ArrowUpRight/Clock/Camera) et CTA.

## Conformité

- TypeScript strict, types explicites partout (interfaces `OwnerTenant`, `Period`, `AdPerf`, etc.).
- `formatPrice` réutilisé (FCFA / XOF via `Intl`).
- Toutes les chaînes en français.
- shadcn/ui exclusivement (Card, Tabs, Table, Badge, Button, Avatar, Select, Input).
- Mobile-first : cards stack sur mobile, tables sur md+.
- Pas de `redirect` côté pages : `(dashboard)/layout.tsx` enforce déjà `getCurrentDisplayUser` → `/login`. Inutile de doubler côté client.
- `next.config.ts` autorise déjà `picsum.photos` et `ui-avatars.com`.
- `tsc --noEmit` : 0 erreur dans les 3 nouveaux fichiers (les erreurs restantes sont pré-existantes, hors périmètre).

## Points de vigilance

- Les boutons "Inviter un locataire", "Nouvel EDL" et "Personnaliser" déclenchent des toasts info — à brancher sur de vrais modales/Server Actions quand les flux backend seront prêts.
- Aucune liaison Supabase : tout est mock comme demandé en mode démo.
