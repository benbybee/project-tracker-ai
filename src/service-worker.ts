/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Precache and route static assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Cache static assets with cache-first strategy
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.url.includes('/_next/static/'),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API routes with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache main app routes with network-first strategy
registerRoute(
  ({ url }) =>
    url.pathname === '/' ||
    url.pathname === '/dashboard' ||
    url.pathname === '/projects' ||
    url.pathname === '/board' ||
    url.pathname === '/daily' ||
    url.pathname === '/settings' ||
    url.pathname.startsWith('/projects/'),
  new NetworkFirst({
    cacheName: 'app-routes',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache public assets
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin && url.pathname.startsWith('/public/'),
  new CacheFirst({
    cacheName: 'public-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Handle navigation requests for SPA routing
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'navigation-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Skip waiting and claim clients immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync message handling
self.addEventListener('message', (event) => {
  // Accept "PING" or "REQUEST_SYNC" from client
  const { type } = event.data || {};
  if (type === 'REQUEST_SYNC' && 'sync' in self.registration) {
    (self.registration as any).sync.register('tt-sync').catch(() => {});
  }
});

self.addEventListener('sync', (event: any) => {
  if (event.tag === 'tt-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // We can't access Dexie inside the SW. Instead, ask each client to push.
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage({ type: 'DO_PUSH_PULL' });
  }
}

// Enhanced message handling for sync coordination
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SYNC_REQUEST':
      // Forward sync request to all clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_REQUEST',
            data: data,
          });
        });
      });
      break;

    case 'OFFLINE_DETECTED':
      // Notify clients about offline state
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'OFFLINE_DETECTED',
            data: data,
          });
        });
      });
      break;

    case 'ONLINE_DETECTED':
      // Notify clients about online state
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'ONLINE_DETECTED',
            data: data,
          });
        });
      });
      break;
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([self.clients.claim(), cleanupOutdatedCaches()]));
});

// Handle install event
self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([self.skipWaiting(), self.clients.claim()]));
});
