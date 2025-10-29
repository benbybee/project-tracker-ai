// Minimal SW registration with **no toasts**.
// If you previously had toasts on install/ready/online/offline, they've been removed.
// This is safe to import from a small client component (see PWAInit).
export function registerSW() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // Only register in production or when testing PWA
  if (
    process.env.NODE_ENV === 'development' &&
    !process.env.NEXT_PUBLIC_ENABLE_PWA_DEV
  ) {
    console.log(
      'Service worker disabled in development. Set NEXT_PUBLIC_ENABLE_PWA_DEV=true to test PWA features.'
    );
    return;
  }

  // Register the service worker
  navigator.serviceWorker
    .register('/service-worker.js', { scope: '/' })
    .then((registration) => {
      console.log(
        'Service Worker registered successfully:',
        registration.scope
      );

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available, will activate on next page load
              console.log('New service worker available');
            }
          });
        }
      });
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}
