# Rapport — Ibrahima Sow — Wave 11

## Mission
Refonte LUXE des 3 pages d'authentification + layout split.

## Livrables
- `src/app/(auth)/layout.tsx` — Layout split desktop image (50%) + form (50%) avec :
  - Image Unsplash villa luxe `photo-1613490493576-7fde63acd811`
  - Overlay gradient `from-black/40 via-kaza-navy/60 to-kaza-navy/90`
  - Logo KAZA en haut à gauche (blanc, fond carré arrondi)
  - Bloc citation Aïcha Diakité (font-heading text-2xl, bordure verte)
  - Mobile : bandeau image compact 32 unités en haut + form pleine largeur
  - Footer auth discret avec liens CGU / Confidentialité
- `src/app/(auth)/login/page.tsx` — Badge "Mode démo actif", H1 "Bon retour parmi nous", card comptes test, CTA signup. Cascade FadeIn 0/100/200/300ms.
- `src/app/(auth)/signup/page.tsx` — Badge vert "Accès instantané", H1 "Créez votre compte KAZA en 30 secondes", grille 2x2 des 4 rôles (Home/Building2/GraduationCap/ShieldCheck), CTA login.
- `src/app/(auth)/forgot-password/page.tsx` — Badge "Réinitialisation sécurisée", H1 avec mention expiration 30 min, lien retour login.

## Points clés
- Forms `login-form.tsx` / `signup-form.tsx` / `forgot-password-form.tsx` non touchés (préservation logique démo).
- Animations GPU via `FadeIn` (opacity + translateY uniquement).
- `images.unsplash.com` déjà whitelisté dans `next.config.ts`.
- Typographie cohérente : `font-heading`, `tracking-tight`, palette kaza-navy / kaza-blue / kaza-green respectée.
- Aucune nouvelle dépendance.
