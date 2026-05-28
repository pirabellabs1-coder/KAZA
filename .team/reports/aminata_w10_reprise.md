# Rapport Aminata — Wave 10 (reprise)

## Statut : Livré

5 fichiers prioritaires livrés sur le périmètre demandé. Aucune erreur TypeScript
introduite (vérifié via `tsc --noEmit`, les erreurs restantes sont préexistantes
et hors périmètre).

## Fichiers livrés

| # | Fichier | Lignes | Notes |
|---|---|---|---|
| 1 | `src/app/(dashboard)/owner/properties/[id]/edit/page.tsx` | ~100 | Server Component : `getCurrentDisplayUser` (redirect login si null) + `getPropertyById` (notFound), breadcrumbs, header, extraction city/quartier depuis address |
| 2 | `src/app/(dashboard)/owner/properties/[id]/edit/edit-form.tsx` | ~480 | Client form sections Infos/Localisation/Prix/Équipements/Photos. Validation inline, persist `kaza-property-edit-{id}`, dialog suppression 2 étapes (avec saisie "SUPPRIMER") |
| 3 | `src/app/(dashboard)/owner/promotion/page.tsx` | ~430 | 3 plans radio cards (Boost 7j/30j/Premium), select annonce, récap, campagnes actives avec progress bar + bouton arrêter, tableau comparaison avant/après. Persist `kaza-boosts` |
| 4 | `src/app/(dashboard)/reports/page.tsx` | ~290 | Tabs Tous/Pending/Reviewed/Résolus avec compteurs, cards signalements, dialog détails, `EmptyState` si vide. Utilise `getMyReports` de `demo-reports.ts` (déjà existant avec 5 seeds) |
| 5 | `src/components/shared/report-button.tsx` | ~250 | 3 variants (`icon`/`link`/`button`), dialog inline avec 7 raisons radio cards, textarea, checkbox certification, persist via `addReport` |

## Décisions

- **Edit form séparé** : la spec dit "inline pour aller vite" mais `page.tsx` doit
  rester Server Component (auth + notFound). Form client extrait dans
  `edit-form.tsx` (même dossier, importé directement). Pragmatique.
- **Availability déjà présent** : `availability/page.tsx` + `availability-calendar.tsx`
  existent déjà avec calendrier 7x6, blocages localStorage `kaza-availability-{id}`,
  raisons + notes — conforme au spec. Non re-créé.
- **Réutilisation `demo-reports.ts`** : module déjà présent avec types, seeds,
  `getMyReports`, `addReport`, `REASON_META`, `STATUS_META`. Mes 2 fichiers
  signalements s'appuient dessus, zéro duplication.
- **Icônes** : map `iconName` (string dans `demo-reports`) → `LucideIcon` réelle
  côté composant pour éviter d'importer toutes les icônes dans le module data.

## Conformité

- TypeScript strict, FR partout, shadcn/ui only (Card/Dialog/Tabs/Select/Textarea/Button/Badge/Progress/Input/Label).
- Toasts via `@/components/ui/toast-helper` (success/error/info).
- Format prix `Intl.NumberFormat('fr-FR') + ' FCFA'`.
- Mobile-first (grids responsive `sm:` / `lg:`).
- Aucune nouvelle dépendance ajoutée.
