'use client';
import { useEffect } from 'react';
import { registerSW } from '@/lib/pwa-register';

/**
 * Enhanced PWA initializer with toast suppression.
 * Sync management is now handled by SyncBootstrap component.
 */
export default function PWAInit() {
  useEffect(() => {
    // Initialize PWA registration
    registerSW();

    // Disable stray offline toasts/flickers
    disableOfflineToasts();
  }, []);

  return null;
}

// ✨ CLEANUP PATCH — fully suppress offline toasts or flickers
function disableOfflineToasts() {
  if (typeof window === 'undefined') return;

  // Remove any existing global event listeners that may dispatch 'offline' toasts
  const existingOnlineHandler = () => {};
  const existingOfflineHandler = () => {};
  
  window.removeEventListener('online', existingOnlineHandler);
  window.removeEventListener('offline', existingOfflineHandler);

  // Intercept Workbox or Dexie offline notifications (if any)
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const type = event.data?.type || '';
      if (['OFFLINE_READY', 'NEED_REFRESH', 'WORKBOX_OFFLINE'].includes(type)) {
        event.stopImmediatePropagation?.();
      }
    });
  }

  // Prevent default browser "offline" banners in some PWAs
  // Use capture phase to intercept before other handlers
  window.addEventListener('offline', (e) => {
    e.stopImmediatePropagation();
  }, true);
  
  window.addEventListener('online', (e) => {
    e.stopImmediatePropagation();
  }, true);
}
