# Moussa Keïta — Vague 11 (REFONTE LUXE)

## Périmètre livré
Refonte luxe complète de 5 pages marketing publiques avec hero plein écran, glassmorphism, animations RevealOnScroll, cards arrondies 3xl et typographie premium.

## Fichiers modifiés
- `src/app/(main)/pricing/page.tsx` — Hero gradient navy + image, 4 StatCounters, 3 plans premium (Locataire / Starter recommandé / Pro premium gold), tableau comparatif 18 lignes sticky, 4 témoignages propriétaires, 6 FeatureHighlights, FAQ 6 questions, CtaBanner final.
- `src/app/(main)/pricing/pricing-toggle.tsx` *(nouveau)* — Toggle client Mensuel/Annuel avec badge `–2 mois`.
- `src/app/(main)/how-it-works/page.tsx` — Hero AnimatedGradientBg, tabs sticky 3 profils, vidéo placeholder dans GlassPanel, 3 piliers sécurité, 9 cards villes (Bénin + bientôt), marquee 6 témoignages.
- `src/app/(main)/how-it-works/how-it-works-tabs.tsx` *(nouveau)* — Tabs sticky client avec image illustration + 4 étapes par profil (Locataire/Propriétaire/Étudiant) + CTA signup.
- `src/app/(main)/faq/page.tsx` — Hero AnimatedGradientBg + search bar GlassPanel, 8 cards catégories (gradient + icônes colorées), 8 accordions par catégorie (≥6 Q/R chacune), 3 options contact, NewsletterForm block.
- `src/app/(main)/contact/page.tsx` — Hero compact navy + 3 mini-stats glass, layout 2 cols (info luxe gauche / ContactForm dans Card 3xl droite), bandeau navy press@kaza.africa, 4 quick FAQ cards, 3 cards bureaux (Cotonou actif / Lomé / Abidjan bientôt).
- `src/app/(main)/help/page.tsx` — Hero AnimatedGradientBg + search GlassPanel, 8 cards catégories large, 5 BlogPreviewCards grid, 3 grandes cards contact, bandeau status vert pulse, CTA final.

## Choix techniques
- Réutilisation systématique des composants existants : `SectionHero`, `StatCounter`, `TestimonialCard`, `FeatureHighlight`, `CtaBanner`, `BlogPreviewCard`, `NewsletterForm`, `RevealOnScroll`, `FadeIn`, `GlassPanel`, `AnimatedGradientBg`, `Marquee`.
- Données issues de `@/lib/marketing-data` (TESTIMONIALS filtrés rôle Propriétaire, FEATURES) et `@/lib/blog-data` (BLOG_ARTICLES.slice(0,5)).
- Aucune nouvelle dépendance UI, tout en shadcn + lucide-react.
- Mobile-first, py-24, rounded-3xl, hover shadow-2xl, gradients navy/blue/green, typo font-heading text-7xl.

## Validation
- `npx tsc --noEmit` : 0 erreur sur les 7 fichiers modifiés (erreurs pré-existantes hors périmètre).
- `npx eslint` sur les 7 fichiers : EXIT 0.
- Metadata SEO + OpenGraph présents sur chaque page.
