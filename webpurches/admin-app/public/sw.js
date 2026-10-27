/**
 * Fast Delivery Admin Mission Control Service Worker
 * Cache Name: fd-admin-v1
 * Scope: /
 */

const CACHE_NAME = 'fd-admin-v1';
const CACHE_PREFIX = 'fd-admin-';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

const SENSITIVE_API_PATTERNS = [
  '/api/admin/',
  '/api/settlements/',
  '/api/disputes/',
  '/api/support/',
  '/api/auth/',
  '/api/accounts/',
  '/api/restaurants/',
  '/api/orders/',
  '/api/notifications/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW-Admin] Precache partial error:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => {
            console.log('[SW-Admin] Removing old cache:', k);
            return caches.delete(k);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Non-GET requests: Network-only, never cached
  if (req.method !== 'GET') {
    return;
  }

  // 2. Sensitive API requests: Network-only, never cached
  if (url.pathname.startsWith('/api/')) {
    const isSensitive = SENSITIVE_API_PATTERNS.some((pat) => url.pathname.includes(pat));
    if (isSensitive) {
      event.respondWith(
        fetch(req).catch(() => {
          return new Response(
            JSON.stringify({
              error: 'offline',
              message: 'Live connection required. Administrative changes cannot be audited offline.',
              authoritative: false
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
      );
      return;
    }
  }

  // 3. Navigation requests: Network-first with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/offline.html');
          return fallback || caches.match('/index.html');
        })
    );
    return;
  }

  // 4. Static assets: Stale-While-Revalidate
  const isStaticAsset =
    url.origin === self.location.origin ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
