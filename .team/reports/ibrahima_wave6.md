# Wave 6 - Ibrahima Sow (UI/UX Premium components)

## Livrables

8 composants premium reutilisables crees dans `src/components/marketing/` :

| Fichier | Type | Role |
|---|---|---|
| `stat-counter.tsx` | client | Compteur anime 0 -> value via IntersectionObserver, easing cubic ease-out, format fr-FR, texte en gradient navy -> blue |
| `testimonial-card.tsx` | server | Carte temoignage premium avec quote icon, etoiles, avatar UI-Avatars ringed, highlight via `<mark>` kaza-green |
| `city-card.tsx` | server | Carte ville cliquable 4/3, Image Next/Image avec scale hover, overlay degrade noir, badges count + prix moyen FCFA |
| `partner-bar.tsx` | server | Bandeau partenaires : cercles colores avec initiales blanches, grayscale par defaut, colore au hover (group-hover) |
| `gradient-card.tsx` | server | Wrapper card avec 4 variants (navy/blue/green/sunset), border subtile white/10, blob decoratif |
| `feature-highlight.tsx` | server | Feature card avec icon lucide dynamique (10 icons mappes), cercle kaza-blue/10, metric en kaza-green |
| `press-strip.tsx` | server | Bandeau "Vu dans la presse" : pilules colorees + nom du media, hover lift |
| `blog-preview-card.tsx` | server | Carte article : Image 16/10, badge categorie absolute backdrop-blur, reading time + date relative FR via `Intl.RelativeTimeFormat` |

## Decisions techniques

- **Aucune nouvelle dependance** : tout repose sur `next/image`, `next/link`, `lucide-react`, `clsx`/`tailwind-merge` deja installes.
- **Animations Tailwind pures** : `transition-all`, `duration-*`, `hover:-translate-y-*`, `hover:scale-*`. Le seul code JS d'anim est `requestAnimationFrame` dans `stat-counter` (necessaire pour le tween).
- **Accessibilite** :
  - `alt` descriptif sur toutes les images
  - `aria-label`/`aria-hidden` corrects (etoiles, icones decoratives)
  - `aria-live="polite"` sur le compteur
  - `focus-visible:ring` sur les Link cliquables
  - `<time dateTime>` semantique dans le blog card
- **Pas de collision** avec `property-card.tsx` (non touche).
- **Domaine `ui-avatars.com`** deja whiteliste dans `next.config.ts` (verifie). `unoptimized` mis sur l'avatar pour eviter le cache Next inutile.
- **Tokens KAZA** : utilisation exclusive de `kaza-navy`/`kaza-blue`/`kaza-green` declares dans `globals.css` via `@theme inline`.
- **Textes** 100% francais (libelles, ARIA, formatage `toLocaleString('fr-FR')` et `Intl.RelativeTimeFormat('fr-FR')`).

## Notes integration

- `StatCounter` est `'use client'` (animation), tous les autres restent server components -> bonnes perfs landing.
- `GradientCard` est destine a etre wrappe autour de n'importe quel contenu (CTA, stats hero, etc.).
- `CityCard` reutilise `formatPrice` de `@/lib/utils` pour la coherence FCFA.
