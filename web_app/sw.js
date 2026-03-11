const CACHE_NAME = 'story-creator-kids-v1';
const ASSETS = [
  '/',
  '/web_app/index.html',
  '/web_app/login.html',
  '/web_app/dashboard.html',
  '/web_app/style.css',
  '/web_app/assets/images/HistoryCreatorKids.png'
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
