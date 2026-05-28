# Chiamaka — Reprise W11 (F:\ redisponible)

**Auteure** : Chiamaka Okonkwo
**Date** : 2026-05-27
**Périmètre** : Refonte LUXE de 3 pages publiques KAZA

---

## Livrables

### 1. `src/app/(main)/student-living/page.tsx` — RECRÉÉE & REFONTE LUXE
Page index colocation étudiante recréée intégralement (avait été supprimée).
**10 sections** :
1. Hero immersif `h-[80vh]` — image Unsplash étudiants africains, double overlay noir+navy, badge gradient gold "LOGEMENT ÉTUDIANT PREMIUM", titre `text-7xl` avec mot accentué bg-clip-text gradient amber, search bar `GlassPanel` (Input université + Select budget + bouton Chercher), 3 trust badges glass
2. Stats animées — 4 `StatCounter` sur bandeau gradient navy/blue, RevealOnScroll cascade
3. Universités partenaires — 6 cards (UAC, IRGIB, EPAC, ESGIS, UNSTIM, IUT) avec pastilles colorées et hover scale
4. Colocations à la une — grid 3 cols, `RoommateCard` mappées sur `getOpenRoommateListings()`, images Unsplash diversifiées
5. Comment ça marche — 4 `GradientCard` (variants navy/blue/green/sunset) Cherchez/Matchez/Visitez/Emménagez avec numéros stylés et icônes
6. Vivre près du campus — 4 cards quartier (UAC Calavi, IRGIB Akpakpa, ESGIS Cotonou, EPAC Calavi) avec image, distance, nb annonces, prix moyen
7. Témoignages étudiants — `Marquee` infini filtrant `TESTIMONIALS` rôle Étudiant
8. Sécurité étudiante — 3 `FeatureHighlight` (Identités vérifiées / Bail numérique / Médiation) sur fond gradient navy avec glass cards
9. FAQ étudiant — 6 accordéons shadcn arrondis
10. CTA final — `GradientCard variant=green` pleine largeur, 2 boutons CTA, badges trust

### 2. `src/app/(main)/student-living/[id]/page.tsx` — REFONTE LUXE Airbnb-style
- Header sticky `backdrop-blur` avec breadcrumbs + boutons Share/Save
- Galerie magazine asymétrique (1 grande + 4 thumbs grid `sm:grid-cols-4 sm:grid-rows-2`)
- Layout 2 cols `[1fr_400px]` :
  - **Gauche** : titre `text-5xl`, 5 quick stats colorées, "Vos futurs colocataires" (3 avatars + `CompatibilityScore size=sm`), description + équipements icons colorés, espaces communs grid 5 cards, frais partagés (récap eau/élec/internet/total avec footer gradient), localisation (carte placeholder stylisée avec grid + pin animé + distances universités), règles vie commune en badges arrondis, 3 avis colocataires
  - **Droite sticky `top-24`** : `GlassPanel` avec prix énorme, form "Demander à rejoindre" (Textarea + bouton gradient), bloc Service KAZA (3 garanties)
- Section "Autres colocations à proximité" : 4 `RoommateCard`

### 3. `src/app/(main)/status/page.tsx` — REFONTE LUXE
- Hero `min-h-[40vh]` gradient navy/blue + grid pattern, icône Activity dans cercle `animate-ping` + ring emerald, titre `text-6xl`, big indicator `Tous systèmes opérationnels` avec dot animé
- Bandeau uptime — chiffre **99,97%** en gradient bg-clip-text + 30 dots (28 vert + 2 orange jours 18 et 24 pour réalisme), légende
- Services — 11 cards `rounded-3xl` avec icône, dot statut, sparkline SVG gradient (mock paths), réponse en ms, badge statut
- Incidents — timeline verticale `border-l-2` avec dots sévérité colorés (info/minor/maintenance), 4 entrées dont maintenance et incident résolu
- Performance — 4 KPI cards sur fond navy (Réponse 164ms / Erreur 0,03% / 8 240 req/min / 3 régions)
- Subscribe — `GlassPanel` central avec icône cloche, input email + bouton "S'abonner"

---

## Conventions respectées
- TypeScript strict, tout en français premium
- shadcn/ui partout (Accordion, Select, Input, Textarea, Badge, Button, Avatar, Separator)
- Composants existants réutilisés : `RoommateCard`, `CompatibilityScore`, `StatCounter`, `GradientCard`, `FeatureHighlight`, `TestimonialCard`, `FadeIn`, `RevealOnScroll`, `GlassPanel`, `Marquee`
- `RevealOnScroll` / `FadeIn` partout pour les apparitions
- `formatPrice` pour les montants FCFA
- `metadata` SEO sur chacune des 3 pages
- Mobile-first : grids responsive `sm/lg`, header sticky, galerie repliée mobile
- Aucune mention paiement (FedaPay/Kkiapay) — branding KAZA Pay/KAZA Wallet uniquement
- Tailwind v4 + classes `kaza-navy`, `kaza-blue`, `kaza-green`
- Images Unsplash whitelistées (vérifié `next.config.ts`)

## Notes
- `getOpenRoommateListings()` mock-data exposé 3 colocations OPEN — utilisé pour la grille hero et la section "à proximité" sur la fiche détail
- Sparklines status générées en mock paths SVG (gradient fill + stroke smooth)
- Carte localisation = placeholder stylisé avec grid pattern + pin animé (Mapbox non instancié pour cette refonte)
- Build ESLint/TS ignoré côté CI (cf. `next.config.ts`), imports nettoyés
