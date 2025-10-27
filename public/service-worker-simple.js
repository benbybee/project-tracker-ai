// Simple service worker without Workbox dependencies
const CACHE_NAME = 'tasktracker-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/projects',
  '/board',
  '/daily',
  '/settings',
  '/manifest.json',
  '/favicon.ico',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Background sync
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'REQUEST_SYNC' && 'sync' in self.registration) {
    self.registration.sync.register('tt-sync').catch(() => {});
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'tt-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Notify all clients to perform sync
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage({ type: 'DO_PUSH_PULL' });
  }
}
