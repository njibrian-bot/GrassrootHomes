/* GrassrootHomes Service Worker — PWA offline support
   Network-first: visitors always get the latest published site when online.
   The cache is only a fallback for when they're offline, so there's no
   version number to bump when the site changes. */
const CACHE_NAME = 'grassroothomes-v6';

/* Small app shell saved up front so the site opens offline.
   Gallery photos are saved as visitors view them. */
const CORE_ASSETS = [
  './',
  './index.html',
  './gallery.html',
  './css/styles.css',
  './manifest.json',
  './images/Logo.png',
  './images/Square Logo.png'
];

/* Install: pre-cache the app shell. Each file is cached on its own so one
   missing or renamed file can't stop the new service worker installing. */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        CORE_ASSETS.map(asset => cache.add(asset).catch(() => {}))
      ))
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

/* Fetch: network-first, fall back to the cache when offline */
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isLocal = url.origin === self.location.origin;

  /* 'no-cache' makes the browser check with the server for a newer copy
     instead of reusing its own HTTP cache, so updates show immediately. */
  const networkFetch = !isLocal
    ? fetch(request)
    : request.mode === 'navigate'
      ? fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
      : fetch(request, { cache: 'no-cache' });

  event.respondWith(
    networkFetch.then(response => {
      /* Only keep complete responses (skips partial video range requests) */
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(request, { ignoreSearch: true }).then(cached => {
        if (cached) return cached;
        /* Offline and never visited: show the home page */
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })
    )
  );
});
