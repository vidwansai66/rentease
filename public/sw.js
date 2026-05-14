const CACHE_NAME = 'rentease-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/global.css',
  '/css/components.css',
  '/js/api.js',
  '/js/auth.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
