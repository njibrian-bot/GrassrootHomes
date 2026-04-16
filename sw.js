/* GrassrootHomes Service Worker — PWA offline support */
const CACHE_NAME = 'grassroothomes-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './gallery.html',
  './css/styles.css',
  './images/Logo.png',
  './images/Square Logo.png',
  './images/Copilot_20260414_224356.png',
  './images/WhatsApp Image 2026-03-02 at 9.08.34 PM.jpeg',
  './images/WhatsApp Image 2026-03-02 at 9.17.06 PM.jpeg',
  './images/WhatsApp Image 2026-03-02 at 9.17.37 PM.jpeg',
  './images/WhatsApp Image 2026-03-02 at 9.19.03 PM.jpeg',
  './images/WhatsApp Image 2026-03-02 at 9.20.09 PM.jpeg',
  './images/WhatsApp Image 2026-03-02 at 9.31.44 PM.jpeg',
  './images/WhatsApp Image 2026-03-02 at 9.31.59 PM.jpeg'
];

/* Install: pre-cache core assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activate: clean up old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch: cache-first for local assets, network-first for external */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (isLocal) {
    /* Cache-first strategy for local files */
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          /* Offline fallback: serve index.html for navigation requests */
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
    );
  } else {
    /* Network-first for external resources (fonts, flags CDN) */
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
  }
});
