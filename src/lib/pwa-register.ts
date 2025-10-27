// Minimal SW registration with **no toasts**.
// If you previously had toasts on install/ready/online/offline, they've been removed.
// This is safe to import from a small client component (see PWAInit).
export function registerSW() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // Temporarily disabled to fix build issues
  // TODO: Re-enable service worker after deployment is working
  // Service worker registration is intentionally disabled
  return;
}
