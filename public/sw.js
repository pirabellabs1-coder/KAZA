// =============================================================================
// Kaabo - Service Worker (PWA mode hors-ligne)
// Wave 10 - Olamide Adesanya (Mobile/PWA Specialist)
//
// Strategie : network-first avec fallback cache.
// - Au install, pre-cache les pages publiques essentielles.
// - Au fetch (GET), tente le reseau d'abord, puis fallback sur le cache.
// - Les reponses HTML reussies sont mises en cache au passage.
// =============================================================================

const CACHE_NAME = 'kaza-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/search',
  '/about',
  '/pricing',
  '/faq',
  '/help',
  '/login',
  '/signup',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne s'occupe que des requetes GET.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache les reponses HTML reussies provenant de la meme origine.
        const contentType = response.headers.get('content-type') || '';
        if (
          response.ok &&
          event.request.url.startsWith(self.location.origin) &&
          contentType.includes('text/html')
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match('/'))
      )
  );
});
