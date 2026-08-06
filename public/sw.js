/**
 * sw.js — High-Performance Service Worker Cache
 *
 * Caches static JS, CSS, fonts, and images in browser Cache Storage.
 * Accelerates load speed and protects the server under high traffic spikes.
 */

const CACHE_NAME = 'itsharing-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass non-GET requests and API calls
  if (req.method !== 'GET' || url.pathname.startsWith('/api/') || url.hostname.includes('firestore.googleapis.com')) {
    return;
  }

  // Cache-First strategy for static assets (images, css, js, fonts)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|css|js|woff2|ttf)$/i) ||
    url.hostname.includes('r2.dev') ||
    url.hostname.includes('pub-')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedRes = await cache.match(req);
        if (cachedRes) return cachedRes;

        try {
          const networkRes = await fetch(req);
          if (networkRes.ok) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch (e) {
          return cachedRes || Promise.reject(e);
        }
      })
    );
  }
});
