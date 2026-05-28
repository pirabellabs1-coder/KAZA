# Olamide Adesanya — Vague 11 (REFONTE LUXE 7 pages publiques)

## Périmètre livré
Refonte magazine-style luxe de 7 pages publiques, sans toucher aux libs partagées
(`blog-data.ts`, `marketing-data.ts`, `demo-neighborhoods.ts`).

| Fichier | Action | Points clés |
|---|---|---|
| `src/app/(main)/blog/page.tsx` | Refonte | Hero gradient + blobs, filtre catégories chips, featured 5-col grid, grille 3 cols (RevealOnScroll), 4 catégories populaires, newsletter form luxe (gradient navy + blobs) |
| `src/app/(main)/blog/[slug]/page.tsx` | **Création** | Hero image h-[60vh] + overlay, sticky social share bar gauche desktop (Twitter/LinkedIn/Facebook/Copy) + share mobile, body typo custom (Tailwind arbitrary), card auteur ui-avatars, articles similaires via `getRelatedArticles`, CTA gradient. `generateStaticParams` + metadata SEO OG |
| `src/app/(main)/cities/[slug]/page.tsx` | Refonte | Hero plein-bleed h-[70vh] + breadcrumbs blanc, 4 StatCounters dans cards rounded-3xl, 4 PropertyCards à la une, 6 cards quartiers (image + overlay), section "Pourquoi vivre à" navy gradient avec FeatureHighlight, 3 CityCards comparaison, articles blog filtrés, CTA gradient |
| `src/app/(main)/neighborhoods/compare/page.tsx` | Refonte | Hero compact gradient + blobs, toolbar "Tout effacer / Exporter PDF" (window.print), colonnes cards rounded-3xl avec scores barres colorées (vert/orange/rouge), badges highlights/concerns, équipements, section "Top quartiers KAZA" 6 cards calculés par score moyen avec bouton "Comparer". Persistance localStorage `kaza-neighborhoods-compare`. Print-friendly |
| `src/app/(main)/properties/compare/page.tsx` | Refonte | Hero compact gradient, **4 slots max** (au lieu de 3), EmptyState luxe (rounded-3xl border-dashed gradient), tableau comparatif rounded-3xl avec rangées alternées, 12 lignes (type/chambres/sdb/surface/loyer/quartier/vérifié + 6 équipements), boutons "Demander visite (n) / Exporter PDF / Tout effacer". Persistance localStorage `kaza-compare`. CSS print `@page A4 landscape` + print:hidden |
| `src/app/(main)/carrieres/page.tsx` | Refonte | Garde l'export `JOBS` intact (consommé par [slug]). Hero immersif h-[80vh] image Unsplash + overlay, 4 StatCounters (12/6/100%/100%), 6 GradientCards (variants alternés navy/blue/green), filtres équipes chips, grille 2 cols jobs cards rounded-3xl, timeline processus 4 étapes navy gradient, 3 TestimonialCards, CTA candidature spontanée |
| `src/app/(main)/carrieres/[slug]/page.tsx` | Refonte | Hero compact gradient + badges (équipe/lieu/contrat), layout 2 cols : article max-w-3xl (À propos / Responsabilités / Profil / Pourquoi rejoindre — DetailSection + DetailList stylés cards), aside sticky "Postuler" avec mailto pré-rempli (subject + body), card meta team/loc/contrat, section "Autres postes ouverts" 3 cards |

## Qualité
- `tsc --noEmit` : **0 erreur** sur mes 7 fichiers (les erreurs résiduelles du repo sont pré-existantes, hors périmètre).
- `eslint` sur mes 7 fichiers : **0 erreur, 0 warning**.
- Composants existants réutilisés : `BlogPreviewCard`, `CityCard`, `StatCounter`, `FeatureHighlight`, `GradientCard`, `TestimonialCard`, `PropertyCard`, `FadeIn`, `RevealOnScroll`, `Select`, `Badge`, `Button`, `Input`.
- `generateStaticParams` + `generateMetadata` sur toutes les routes dynamiques (blog/[slug], cities/[slug], carrieres/[slug]).
- Persistance localStorage conservée (clés `kaza-compare` et `kaza-neighborhoods-compare`).
- `JOBS` export préservé dans `carrieres/page.tsx`.

## Notes design LUXE
- Typo : `font-heading text-4xl→text-7xl`, leading-[1.05].
- Cards : `rounded-3xl border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-2xl duration-500`.
- Hero gradients : `from-kaza-navy via-[#0F2A40] to-kaza-blue` + blobs blur-3xl.
- Animations : `FadeIn` headers, `RevealOnScroll` grids (delay décalé 60-100ms).
- Boutons CTA : `rounded-full h-12 px-8 font-semibold` (navy/green).
- Print friendly comparateurs (toolbar `print:hidden`, `@page A4 landscape`).
