/**
 * PWA utility functions for detecting and handling PWA-specific behaviors
 */

/**
 * Detects if the app is running in standalone mode (installed as PWA)
 * Works for both iOS and Android/Chrome
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Chrome/Android
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // iOS Safari
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return isDisplayStandalone || isIOSStandalone;
}

/**
 * Detects if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Detects if the device is iOS and app is running in standalone mode
 */
export function isIOSPWA(): boolean {
  return isIOS() && isStandalone();
}

/**
 * Checks if PWA is installable
 */
export function isPWAInstallable(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if beforeinstallprompt event was fired (Android/Chrome)
  return 'BeforeInstallPromptEvent' in window || isIOS();
}

/**
 * Gets display mode information
 */
export function getDisplayMode(): 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' {
  if (typeof window === 'undefined') return 'browser';

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

/**
 * Prevents iOS Safari bounce effect in standalone mode
 */
export function preventIOSBounce() {
  if (!isIOSPWA()) return;

  document.body.style.overscrollBehavior = 'none';
  
  // Prevent pull-to-refresh on iOS
  let lastTouchY = 0;
  let preventPullToRefresh = false;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    lastTouchY = e.touches[0].clientY;
    preventPullToRefresh = window.pageYOffset === 0;
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const touchYDelta = touchY - lastTouchY;
    lastTouchY = touchY;

    if (preventPullToRefresh) {
      // Only prevent if pulling down
      if (touchYDelta > 0) {
        e.preventDefault();
      }
    }
  }, { passive: false });
}

