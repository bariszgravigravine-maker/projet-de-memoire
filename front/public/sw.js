const CACHE_NAME = 'nestfind-v2';

// Seuls les assets statiques sont mis en cache
const CACHE_PATTERNS = [
  /\/images\//,
  /\/logo/,
  /\/icon/,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:css|woff2?|ttf|eot)$/,
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ne pas intercepter les requetes non-GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ne pas intercepter les requetes API ou Socket.IO
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  // Ne pas intercepter les documents HTML (pages)
  if (request.mode === 'navigate' || request.destination === 'document') return;

  // Ne pas intercepter les scripts JS modules
  if (request.destination === 'script' || request.mode === 'no-cors') return;

  // Ne pas intercepter _vercel internals
  if (url.pathname.startsWith('/_vercel/') || url.pathname.startsWith('/_next/')) return;

  // Ne pas intercepter manifest.json (souvent sujet a redirection SSO)
  if (url.pathname.endsWith('/manifest.json')) return;

  // Verifier si l'URL correspond a un pattern cacheable
  const shouldCache = CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (!shouldCache) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((networkResponse) => {
          // Mettre en cache uniquement les reponses valides (200)
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // En cas d erreur reseau, retourner une reponse 503 si rien en cache
          return new Response('Ressource indisponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
  );
});
