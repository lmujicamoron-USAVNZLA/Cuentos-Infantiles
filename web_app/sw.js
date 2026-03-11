const CACHE_NAME = 'story-creator-kids-v1';
const ASSETS = [
  './',
  'index.html',
  'login.html',
  'dashboard.html',
  'style.css',
  'assets/images/HistoryCreatorKids.png'
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
