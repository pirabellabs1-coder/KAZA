# Olamide - Wave 6 PREMIUM - Rapport

## Mission
Couche d'animations et d'effets visuels premium reutilisables pour KAZA, zero dependance externe (pas de framer-motion).

## Fichiers livres
- `src/hooks/use-in-view.ts` - hook IntersectionObserver SSR-safe (threshold 0.15, once true, rootMargin '0px' par defaut). Fallback `setInView(true)` si IO indisponible.
- `src/components/shared/fade-in.tsx` (client) - fade + translateY(8px -> 0). Props: `delay`, `duration` (defaults 0 / 600).
- `src/components/shared/reveal-on-scroll.tsx` (client) - variantes `up|down|left|right|zoom`, `distance` 24 par defaut, `delay`, `duration`.
- `src/components/shared/marquee.tsx` (client) - bande infinie, contenu duplique pour boucle continue, calcul de duree base sur `speed` (px/s) et `contentWidth`, pause au survol via classe `marquee-pause`.
- `src/components/shared/glass-panel.tsx` (server-friendly) - glassmorphism avec maps `intensity` (light/medium/strong -> blur-md/lg/xl) et `tint` (navy/blue/white), bord blanc translucide, rounded-2xl, shadow-xl.
- `src/components/shared/parallax-image.tsx` (client) - parallax via `getBoundingClientRect` (centre element vs centre viewport), throttle `requestAnimationFrame`, listeners passifs, court-circuit si `prefers-reduced-motion`. Utilise `next/image` avec `fill` par defaut.
- `src/components/shared/animated-gradient-bg.tsx` (client) - 3 blobs (kaza-blue, kaza-green, kaza-navy subtil) avec delays decales 0/2s/4s, overlay `bg-white/80 backdrop-blur-3xl`, container `relative overflow-hidden isolate`.
- `src/styles/animations.css` - keyframes `marquee-left/right`, `blob`, `shimmer`, classes `animate-blob`, `animation-delay-2000/4000`, `animate-shimmer`, et bloc `@media (prefers-reduced-motion: reduce)` qui desactive tout.

## Conventions respectees
- TypeScript strict, generics sur `useInView<T>`.
- SSR-safe : guards `typeof window !== 'undefined'` + `typeof IntersectionObserver`.
- GPU only : `transform` + `opacity`, `will-change` cible.
- `prefers-reduced-motion` respecte cote CSS (animations.css) et cote JS (parallax-image).
- Aucune dep externe ajoutee, utilise `cn` depuis `@/lib/utils` (deja present).

## A faire par Kossi (integration)
Ajouter dans `src/app/layout.tsx`, juste apres l'import de `globals.css` :
```ts
import '@/styles/animations.css';
```
Sans cet import, les composants Marquee et AnimatedGradientBg n'auront pas leurs keyframes (les autres composants - FadeIn, RevealOnScroll, GlassPanel, ParallaxImage - fonctionnent en standalone).

## Notes complementaires
- Le bouton "navy" du `GlassPanel` rend un fond fonce semi-transparent ; preferer `tint="white"` sur fond clair.
- `ParallaxImage` requiert un parent dimensionne (height explicite) puisqu'il utilise `next/image fill` par defaut.
- `Marquee` accepte un tableau enfants ; pour un contenu unique, wrappez-le `[<Logos />]` ou passez plusieurs items pour une vraie boucle visuelle.
- Aucune modification de `src/app/globals.css` (verifie, tokens `kaza-blue`, `kaza-green`, `kaza-navy` deja exposes via `@theme inline`).
