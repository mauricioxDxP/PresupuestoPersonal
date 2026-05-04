// Dynamic cache versioning based on build timestamp
// This changes on every build, forcing cache refresh
const CACHE_VERSION = 'v20260504093416'; // Will be replaced by build script
const CACHE_NAME = `financetrack-${CACHE_VERSION}`;

// Files that trigger a cache refresh when changed
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
];

// Install: precache static assets and force activation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Immediately activate, don't wait for all tabs to close
  self.skipWaiting();
});

// Activate: clean old caches and claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith('financetrack-'))
          .map((key) => caches.delete(key))
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
  // Notify existing tabs that an update is available
  self.registration.addEventListener('updatefound', () => {
    console.log('[SW] New version available');
  });
});

// Message handler for manual refresh requests
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'getVersion') {
    event.ports[0].postMessage(CACHE_VERSION);
  }
});

// Fetch: NetworkFirst for API, CacheFirst for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests: NetworkFirst (GET only), bypass for other methods
  if (url.pathname.startsWith('/api/')) {
    // Don't cache non-GET requests
    if (event.request.method !== 'GET') {
      event.respondWith(fetch(event.request));
      return;
    }
    
    event.respondWith(
      fetch(event.request, {
        // Timeout rápido para no dejar la UI colgada
        signal: AbortSignal.timeout(5000),
      })
        .then((response) => {
          // No cachear respuestas de error
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, devolver error en vez de缓存
          return caches.match(event.request).then((cached) => {
            if (cached && !cached.ok) return cached;
            return new Response(JSON.stringify({ error: 'Network error, please retry' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // Static assets: NetworkFirst (always get fresh, cache as fallback)
  if (
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // No cache either, fail gracefully
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // HTML pages / SPA routes: siempre servir index.html
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        if (cached) return cached;
        return fetch(event.request);
      })
    );
    return;
  }

  // Default: NetworkFirst
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        });
      })
  );
});
