/**
 * ITShare Service Worker
 * Provides offline caching for static assets and app shell
 */
const CACHE_NAME = 'itshare-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/manifest.json',
];

// Install — pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation requests — network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets — cache first, network fallback
  if (request.url.match(/\.(js|css|woff2?|png|jpg|svg|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }
});
