// Minimal SW registration with **no toasts**.
// If you previously had toasts on install/ready/online/offline, they've been removed.
// This is safe to import from a small client component (see PWAInit).
export function registerSW() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // Avoid double-registering in dev HMR
  // and bail out in unsupported contexts.
  const alreadyRegistered = (window as any).__TT_SW_REGISTERED__;
  if (alreadyRegistered) return;

  // Mark as registered for this session
  (window as any).__TT_SW_REGISTERED__ = true;

  // Standard registration — no event toasts.
  // If you use Workbox, you can swap this for Workbox('/service-worker.js').register()
  // The key point: **no UI notifications** here.
  navigator.serviceWorker
    .register('/service-worker.js')
    .catch((err) => {
      // Silent failure — you can log if you need telemetry
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[PWA] SW registration failed:', err);
      }
    });
}
