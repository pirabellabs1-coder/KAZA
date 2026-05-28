# Rapport — Ibrahima Sow · Wave 10 (reprise post rate-limit)

**Date** : 27 mai 2026
**Périmètre** : 4 pages KAZA Pro / Plus (commercial B2B + dashboards)

## Livrables

### Pages commerciales (priorité haute)

1. **`src/app/(main)/pro/page.tsx`** — Landing B2B KAZA Pro
   - Hero plein écran `bg-kaza-navy` + dégradé radial, badge "KAZA Pro"
   - `PartnerBar` mocké (4 agences béninoises : Premier Immobilier, Bénin Habitat, Atlantique Real, Coastline Properties)
   - Section 6 features en cards (Multi-utilisateurs, Permissions, Analytics, API REST, Support dédié, White-label) avec icônes Lucide
   - Section 3 tarifs (Starter 50 000 FCFA / Pro 150 000 FCFA / Enterprise sur devis) + comparatif 12 lignes (responsive, scroll horizontal mobile)
   - 3 `TestimonialCard` agences béninoises
   - CTA "Demander une démo" : formulaire client (composant séparé pour respecter Server Component)

2. **`src/app/(main)/pro/pro-demo-form.tsx`** — Client form
   - React Hook : state local + validation simple
   - Champs : nom agence (req), contact (req), email (req), téléphone, taille agence (Select 4 options), message
   - Toast success/error via `@/components/ui/toast-helper`
   - Reset formulaire après envoi

3. **`src/app/(main)/plus/page.tsx`** — Landing Premium
   - Hero gradient `amber-500 → yellow-300` + badge couronne
   - 6 cards avantages (Boost mensuel, Analytics privées, Support 24/7, Identité 2h, Stockage docs, Concierge personnel)
   - Pricing 2 cards : mensuel 9 900 FCFA, annuel 99 000 FCFA (badge "2 mois offerts", équivalence affichée)
   - 3 testimonials membres Plus (Cotonou, Calavi, Abomey-Calavi)
   - Comparatif Free vs Plus (12 lignes, table responsive)
   - CTA gradient or → `/dashboard/plus`

### Dashboards

4. **`src/app/(dashboard)/agency/page.tsx`** — Dashboard agence Pro
   - Bandeau header dégradé navy + badge "Pro" orange + boutons "Gérer l'équipe" / "Analytics complètes"
   - 4 `StatsCard` : 147 annonces actives, 8 membres équipe, 284 visites mai, 16 800 000 FCFA CA
   - Section Équipe : 8 mini-avatars colorés (overlap `-space-x-3`) + compteurs (total, actifs, visites/agent)
   - **Graphique SVG custom** revenus 12 mois (juin 2025 → mai 2026) : path linéaire bleu + zone dégradée + grille pointillée + points cerclés
   - Top 5 annonces avec rang numéroté + vues/visites + CA

5. **`src/app/(dashboard)/plus/page.tsx`** — Dashboard membre Plus
   - Bandeau header gradient or + badge couronne "Plus"
   - 3 stats : 127 500 FCFA économies, 12/30 avantages utilisés, 2 450 points bonus
   - 6 cards "Mes avantages actifs" (statut Actif/Disponible avec badges colorés)
   - Section Concierge KAZA : avatar Awa Diakité + message d'accueil + bouton "Démarrer le chat" (placeholder)
   - Historique 6 entrées avec économies réalisées par avantage
   - Bouton "Gérer mon abonnement" → `/settings#subscription`

## Conventions respectées

- **TypeScript strict** : zéro nouvelle erreur (vérifié `tsc --noEmit`, les erreurs restantes sont pré-existantes hors périmètre)
- **FR** : tous les textes UI, metadata, alt, aria-labels en français
- **shadcn/ui** : Button, Badge, Card, Input, Label, Textarea, Select uniquement (aucune nouvelle dépendance UI)
- **Mobile-first** : grids responsives `sm:` `lg:`, tables avec `overflow-x-auto`, headers `flex-col sm:flex-row`
- **Prix** : `new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'`
- **Toast** : `@/components/ui/toast-helper`
- **Palette** : `kaza-navy`, `kaza-blue`, `kaza-green` + `amber-*` pour Plus (signature premium)
- **Pas de mention paiement spécifique** : aucun nom de provider externe (KAZA Pay/Wallet mentionnés ailleurs, hors périmètre ici)
- **Icônes** : Lucide React (corrigé `Concierge` → `ConciergeBell` après vérif disponibilité)

## Décisions design

- **Hero Pro** plein écran (min-h 80vh) pour impact B2B fort vs. `SectionHero` partagé qui aurait été trop léger
- **Plus** : palette ambre/or systématique pour signaler le premium, contrastée avec navy KAZA
- **Graphique SVG custom** côté agency : pas de lib externe (Recharts/Chart.js absent du projet), implémentation 12 mois avec gradient + points
- **Formulaire démo** isolé en client component séparé pour garder la page `/pro` Server Component (meilleur SEO + RSC streaming)
- **Liens placeholders** `/dashboard/agency/{team,analytics}` non créés (hors périmètre stricte des 4 fichiers)

## Tests à effectuer (futur Wave)

- Playwright responsive 320 / 768 / 1280 sur les 4 pages
- Vérifier overflow tables comparatives sur petits écrans
- Tester soumission formulaire `/pro` (toast success)
- Branchement réel des stats sur queries Supabase (actuellement mocké)
