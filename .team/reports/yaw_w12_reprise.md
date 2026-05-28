# Yaw — W12 Reprise (5 pages footer)

## Statut
DONE. 5 pages livrées, 0 erreur TS sur le périmètre.

## Livré
1. **`src/app/(main)/guide-proprietaire/page.tsx`** (~390 l) — magazine premium 8 sections :
   - Hero gradient navy→green + blobs blurés, badge "Guide premium", H1 6xl avec gradient sur "guide complet du propriétaire"
   - Stats : 4 `<StatCounter>` (8 500+ propriétaires / +35 % revenus / 4,8 sur 5 satisfaction / 24/7 support)
   - 6 `<FeatureHighlight>` "Pourquoi KAZA" (KYC, escrow, OHADA, analytics, support, visibilité)
   - Timeline verticale 4 étapes avec ligne gradient kaza-blue→green→navy, badges durée, CTA contextuels (`/signup?role=OWNER`, `/owner/properties/new`)
   - 6 cards bonnes pratiques (Photos pro, Description, Prix, Réactivité, Vérif, Bail OHADA)
   - 6 mini-cards outils KAZA dans `<GlassPanel>` sur fond navy (Dashboard, Calendrier, Analytics, Contrats, Messagerie, Notifications)
   - FAQ accordion 4 questions juridiques (durée bail, dépôt, augmentation, résiliation)
   - CTA final gradient green→navy avec micro trust-signals (sans engagement / support 24/7 / KYC)

2. **`src/app/(main)/securite/page.tsx`** (~360 l) — page rassurante 7 sections :
   - Hero gradient navy→blue, badge "Sécurité", H1 6xl
   - Stats : 4 `<StatCounter>` (100 % KYC / 0 fraude / 256 AES / 1 audit)
   - 6 piliers en cards premium avec barre gradient top accent + icônes colorées
   - 6 cards conseils (Ne payez pas hors KAZA, badge vérifié, messagerie, signaler, lire contrat, 2FA)
   - 3 étapes incident dans `<GlassPanel>` sur fond navy
   - 4 badges certifications (APDP, OHADA, Code numérique Bénin, Standards bancaires)
   - CTA final `<GradientCard variant=navy>` avec `mailto:security@kaza.africa`

3. **3 pages de redirection** (metadata SEO + `redirect()`) :
   - `/maisons` → `/search?type=HOUSE`
   - `/appartements` → `/search?type=APARTMENT`
   - `/colocation` → `/student-living`

## Composants réutilisés
`StatCounter`, `FeatureHighlight`, `GradientCard`, `FadeIn`, `RevealOnScroll`, `GlassPanel`, `Card`, `Badge`, `Button`, `Accordion`. Aucun composant nouveau créé.

## Conventions respectées
- TypeScript strict, mobile-first (`sm:` / `lg:`)
- 100 % français, metadata SEO + OpenGraph sur les 2 pages premium
- Palette kaza-navy/blue/green, `font-heading tracking-tight`, container `max-w-7xl px-4 lg:px-8`
- Animations cascadées par modulo (`delay={(idx % N) * 100}`)
- shadcn/ui exclusivement, zéro dépendance ajoutée

## Vérification
`npx tsc --noEmit` ciblé sur les 5 fichiers : **0 erreur**. Erreurs TS restantes du repo (contracts, validator student-living, etc.) sont préexistantes et hors périmètre.

## Risques / Notes
- Le validator Next signale `student-living/page.js` introuvable (parent supprimé) — la redirection `/colocation → /student-living` pourrait casser si `/student-living/page.tsx` n'est pas restauré par un autre dev. À surveiller.
- Test Playwright responsive non exécuté (périmètre = fichiers + rapport).
- Liens `/owner/properties/new`, `/help`, `/pricing`, `/signup?role=OWNER` assumés existants (présents dans le footer et les pages voisines).
