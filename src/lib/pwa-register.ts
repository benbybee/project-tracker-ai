/**
 * Service worker is auto-registered by next-pwa in production.
 * This file handles service worker updates with active reload strategy.
 */

let updateCheckInterval: NodeJS.Timeout | null = null;

/**
 * Registers service worker update handlers with automatic reload
 */
export function registerSW() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (process.env.NODE_ENV !== 'production') return;

  // Handle service worker updates with auto-reload
  navigator.serviceWorker.ready
    .then((registration) => {
      console.log('✅ Service Worker ready and controlling page');

      // Handle updates found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Service Worker update found, installing...');

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                '✅ New version installed! Reloading in 5 seconds...'
              );

              // Auto-reload after 5 seconds to apply update
              setTimeout(() => {
                console.log('🔄 Reloading to apply update...');
                window.location.reload();
              }, 5000);
            }
          });
        }
      });

      // Check for updates periodically (every hour)
      updateCheckInterval = setInterval(
        () => {
          console.log('🔍 Checking for service worker updates...');
          registration.update().catch((err) => {
            console.error('Failed to check for updates:', err);
          });
        },
        60 * 60 * 1000
      ); // 1 hour

      // Check for updates when page becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          console.log('👀 Page visible, checking for updates...');
          registration.update().catch((err) => {
            console.error('Failed to check for updates:', err);
          });
        }
      });

      // Initial update check
      registration.update().catch((err) => {
        console.error('Initial update check failed:', err);
      });
    })
    .catch((err) => {
      console.error('Service Worker registration failed:', err);
    });

  // Cleanup on unmount
  return () => {
    if (updateCheckInterval) {
      clearInterval(updateCheckInterval);
    }
  };
}
