# Yaw — Wave 6 PREMIUM (Landing refonte)

## Statut
DONE. `src/app/(main)/page.tsx` entièrement refondue (premium, ~700 lignes vs ~340 initiales).

## Livré
13 sections orchestrées :
1. **Hero immersif** (min-h-[85vh]) — image Unsplash villa moderne + double overlay (black/55 vers kaza-navy/85 + tr blue), badge glass "N°1 Afrique de l'Ouest", H1 7xl avec gradient green→blue sur "logement de rêve", `<PropertySearchBar>` wrappé dans `<GlassPanel intensity="strong">`, trust signals + `<Marquee>` partenaires.
2. **Stats** — 4 `<StatCounter>` animés depuis PLATFORM_STATS avec `<RevealOnScroll>` cascadés (0/100/200/300ms).
3. **Features** — 6 `<FeatureHighlight>` (FEATURES) dans wrappers hover (lift + border kaza-blue).
4. **Annonces à la une** — 4 colonnes desktop / 2 tablet / 1 mobile, données via `fetchWithFallback(getFeaturedProperties, getMockFeaturedProperties)`.
5. **Villes** — 6 `<CityCard>` (CITIES) en grid 3 colonnes avec zoom reveal.
6. **Comment ça marche** — 3 `<GradientCard variant=blue|navy|green>` (Locataire/Propriétaire/Étudiant), 3 steps numérotés + CTA chacune.
7. **Témoignages** — `<Marquee speed={45}>` horizontal des 8 `<TestimonialCard>` (width 340-400px).
8. **Espace étudiant** — `<GradientCard variant=navy>` full-width split, 4 images Unsplash en grille décalée + badge prix `<GlassPanel>` flottant "À partir de 25 000 FCFA/mois".
9. **Blog** — 4 `<BlogPreviewCard>` (BLOG_PREVIEWS).
10. **`<PressStrip items={PRESS}>`**.
11. **`<PartnerBar partners={PARTNERS}>`** détaillé.
12. **CTA final** — bg-kaza-navy + blobs blurés, titre 6xl, 2 boutons (green + white outline).
13. **Newsletter** compacte (logique form préservée).

## Choix techniques
- Tous les composants Wave 6 (StatCounter, GradientCard, Marquee, GlassPanel, RevealOnScroll, FadeIn, CityCard, FeatureHighlight, BlogPreviewCard, PressStrip, PartnerBar, TestimonialCard) sont **livrés et importés** — aucun fallback inline nécessaire.
- Fix `bedrooms/bathrooms/square_meters ?? 0` (PropertyCard exige `number`, DB renvoie `number|null`).
- Animations cascadées par modulo `delay={100*(idx%N)}` pour éviter retard cumulé sur les longues grilles.
- Container `max-w-7xl px-4 lg:px-8`, sections `py-20 lg:py-28`, headings `font-heading tracking-tight`.

## Vérification
`npx tsc --noEmit` : **0 erreur sur `src/app/(main)/page.tsx`**. Les erreurs TS restantes du repo sont préexistantes (contracts, dispatch, types Supabase) — hors périmètre.

## Risques
- Test visuel/responsive Playwright non exécuté (périmètre = fichier page + rapport). À valider par QA Wave 6.
- Dépend de `src/styles/animations.css` (Kossi) pour le keyframe `marquee-left/right/pause` et `animate-blob` : si l'import dans `layout.tsx` n'est pas fait, marquee/blobs seront statiques (graceful — pas de crash).
