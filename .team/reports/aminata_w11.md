# W11 — Refonte LUXE pages publiques B2B/Premium/Partenaires

## Livré

### `/pro` — KAZA Pro B2B Enterprise
- Hero immersif h-[85vh] avec image Unsplash bureau moderne + overlay gradient noir→navy
- Badge "PROPTECH ENTERPRISE" gold gradient, titre 7xl avec mot accentué gradient green→blue
- 2 CTA glass + bandeau 4 logos agences clientes
- 4 StatCounters (120 agences / 8 500 annonces / 92% satisfaction / 24/7)
- 6 features grid alternées (GradientCards + cards classiques rounded-3xl shadow-2xl)
- 3 plans (Starter 50k, Pro 150k recommandé, Enterprise sur devis) avec ring + badge
- Comparatif détaillé 15 lignes table premium gradient header
- 3 témoignages agences (Premier Immobilier, Imoba, AgenceCalavi)
- Timeline 4 étapes onboarding GlassPanel navy
- CTA bandeau démo rounded-[2.5rem] + formulaire existant `ProDemoForm`
- FAQ 5 questions accordion

### `/plus` — KAZA Plus Premium
- Hero h-[80vh] gradient or sunset + image Unsplash + overlay vers navy
- Badge "MEMBRES PRIVILÉGIÉS" gold, titre 7xl mot accentué gradient ambre
- 4 StatCounters privilèges
- 6 avantages cards premium gradient amber avec décors blur
- **Toggle Mensuel/Annuel client** (`pricing-toggle.tsx` extrait) — 9 900/mois vs 99 000/an, badge "Le plus avantageux", économie 19 800 FCFA mise en avant
- 3 témoignages membres Plus
- Comparatif Free vs Plus 12 lignes
- 6 mini-sections "Vos privilèges en détail"
- CTA grand bouton gold gradient → /dashboard/membre-plus
- FAQ 5 questions accordion glass

### `/partners` — Écosystème
- Hero h-[80vh] gradient kaza-navy avec radial constellations + badge "ÉCOSYSTÈME KAZA"
- 4 StatCounters (42 partenaires / 8 pays / 250+ années / 100% sécurisé)
- 4 sections catégories (Paiement, Tech, Presse + PressStrip, Institutions) grilles 4 cards gradient + lien externe
- Marquee témoignages partenaires
- 6 trust badges (ISO 27001, PCI DSS, RGPD, AFD, Africa Tech, GAFA)
- "Devenir partenaire" card large gradient navy + 3 mini-cards bénéfices + 2 CTA (partnerships + presse)

## Conventions respectées
- TypeScript strict, ESLint clean, `tsc --noEmit` aucune erreur sur ces fichiers
- Tout en français, format prix `Intl.NumberFormat('fr-FR')`
- Mobile-first (py-24 desktop, py-16 mobile)
- Composants existants utilisés : StatCounter, TestimonialCard, GradientCard, PressStrip, Marquee, RevealOnScroll, FadeIn, GlassPanel
- shadcn/ui : Badge, Button, Accordion, Card
- Métadonnées server + Image Unsplash whitelistée

## Fichiers
- `F:\KAZA\src\app\(main)\pro\page.tsx`
- `F:\KAZA\src\app\(main)\plus\page.tsx`
- `F:\KAZA\src\app\(main)\plus\pricing-toggle.tsx` (nouveau, isole le state du toggle pour garder page.tsx server)
- `F:\KAZA\src\app\(main)\partners\page.tsx`
