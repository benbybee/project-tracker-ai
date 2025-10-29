// Service worker is auto-registered by next-pwa in production
// This file handles service worker updates only
export function registerSW() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (process.env.NODE_ENV !== 'production') return;

  // Handle service worker updates
  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New version available! Reload to update.');
            // Optional: Show update notification to user
          }
        });
      }
    });
  });
}
