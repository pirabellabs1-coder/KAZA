# Rapport Wave 1 — Olamide Adesanya (Mobile/PWA)

## Fichiers créés / modifiés

- `public/manifest.json` — réécrit selon spec (nom long, scope, 4 entrées d'icônes any/maskable, 3 shortcuts FR, catégories `real_estate`/`lifestyle`/`business`). Référence `/icons/icon-192.png` et `/icons/icon-512.png`.
- `src/hooks/use-online-status.ts` — hook SSR-safe (`true` par défaut), écoute `online`/`offline`.
- `src/hooks/use-install-prompt.ts` — capture `beforeinstallprompt`, expose `{ canInstall, promptInstall, dismiss }`, persistance localStorage `kaza:install-dismissed`, gère aussi `appinstalled`.
- `src/components/shared/offline-banner.tsx` — bandeau rouge fixe top, `role="status"`, icône `WifiOff`.
- `src/components/shared/install-prompt.tsx` — carte flottante au-dessus du bottom-nav (`bottom-[calc(64px+env(safe-area-inset-bottom)+12px)]`), `animate-in slide-in-from-bottom-6`, bouton Installer (kaza-blue) + Plus tard + close.
- `src/components/layout/bottom-nav.tsx` — `<nav>` fixe `md:hidden`, 5 items (Accueil, Rechercher, Favoris, Messages, Profil), actif via `usePathname` avec barre indicateur en `text-kaza-blue`, `pb-[env(safe-area-inset-bottom)]`, h-16.

## Intégration à faire par Nia / Kossi

1. **`src/app/layout.tsx`** (root, global) — ajouter avant `</body>` :
   ```tsx
   import { OfflineBanner } from '@/components/shared/offline-banner';
   import { BottomNav } from '@/components/layout/bottom-nav';
   // ...
   <OfflineBanner />
   {children}
   <BottomNav />
   ```
   Penser à ajouter `pb-16 md:pb-0` sur le wrapper principal pour éviter que le bottom-nav masque le contenu sur mobile.

2. **`src/app/(main)/layout.tsx`** — ajouter `<InstallPrompt />` (uniquement zones publiques/connectées, pas dashboard si non souhaité).

3. **`src/app/layout.tsx` metadata** — vérifier `export const metadata: Metadata = { manifest: '/manifest.json', themeColor: '#1A3A52' }`. Next.js sert `/public/manifest.json` automatiquement, aucun ajustement `next.config.ts` requis.

4. **Viewport** — s'assurer que `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` est présent pour que les safe-area-inset fonctionnent.

## Assets à fournir (Ibrahima)

- `public/icons/icon-192.png` (192×192, fond opaque pour `any`, marge ~10% pour `maskable`).
- `public/icons/icon-512.png` (512×512, idem).

## Dépendances

Aucune nouvelle dépendance npm. Tout est basé sur lucide-react, shadcn/ui Button, et `cn` (`@/lib/utils`) déjà présents. Les classes `animate-in slide-in-from-bottom-*` sont fournies par le plugin tw-animate déjà utilisé (visible dans `ui/dropdown-menu.tsx`).

## Notes complémentaires

- Le bottom-nav pointe vers `/profile`, `/messages`, `/search`, `/tenant/saved` — confirmer ces routes avec Kossi (sinon ajuster).
- Service worker / offline cache : non couverts ici (hors périmètre Wave 1) — à prévoir dans une wave dédiée (next-pwa ou Workbox custom).
