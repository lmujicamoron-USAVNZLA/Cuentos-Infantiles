const CACHE_NAME = 'story-creator-kids-v2';
const ASSETS = [
    './',
    'index.html',
    'login.html',
    'register.html',
    'dashboard.html',
    'create-story.html',
    'story-reader.html',
    'admin.html',
    'terms.html',
    'privacy.html',
    'verify-account.html',
    'style.css',
    'script.js',
    'safety.js',
    'manifest.json',
    'assets/images/HistoryCreatorKids.png'
];

// Install: Pre-cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Pre-cacheando App Shell...');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🧹 Limpiando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Network First for HTML, Cache First for assets
self.addEventListener('fetch', (event) => {
    // Para navegación HTML: Network First (para tener datos Firestore frescos si hay red)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }

    // Para activos (CSS, JS, Imágenes): Cache First
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                // Opcional: Cachear dinámicamente imágenes de Pollinations/Twemoji
                if (event.request.url.includes('pollinations.ai') || event.request.url.includes('twemoji')) {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }
                return networkResponse;
            });
        })
    );
});
