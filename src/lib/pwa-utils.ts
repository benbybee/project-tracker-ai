/**
 * PWA utility functions for detecting and handling PWA-specific behaviors
 */

/**
 * Detects if the app is running in standalone mode (installed as PWA)
 * Works for both iOS and Android/Chrome
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // Chrome/Android - uses display-mode media query
  const isDisplayStandalone = window.matchMedia(
    '(display-mode: standalone)'
  ).matches;

  // iOS Safari - uses navigator.standalone (legacy but still needed)
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Additional check: window.matchMedia for iOS (newer iOS versions)
  const isIOSDisplayMode = window.matchMedia(
    '(display-mode: standalone)'
  ).matches && isIOS();

  return isDisplayStandalone || isIOSStandalone || isIOSDisplayMode;
}

/**
 * Detects if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  );
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
export function getDisplayMode():
  | 'standalone'
  | 'fullscreen'
  | 'minimal-ui'
  | 'browser' {
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

  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
      preventPullToRefresh = window.pageYOffset === 0;
    },
    { passive: false }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      const touchY = e.touches[0].clientY;
      const touchYDelta = touchY - lastTouchY;
      lastTouchY = touchY;

      if (preventPullToRefresh) {
        // Only prevent if pulling down
        if (touchYDelta > 0) {
          e.preventDefault();
        }
      }
    },
    { passive: false }
  );
}

/**
 * Checks if redirects should be prevented (iOS standalone mode requirement)
 * iOS Safari requires that the start_url doesn't redirect, or it will open in browser mode
 */
export function shouldPreventRedirects(): boolean {
  return isIOSPWA();
}

/**
 * Enhanced iOS detection that accounts for different iOS versions and devices
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  
  // Check for iOS devices (iPhone, iPad, iPod)
  const isIOSDevice = /iphone|ipad|ipod/.test(ua);
  
  // Exclude Windows Phone (which can have similar user agent strings)
  const isNotWindowsPhone = !(window as any).MSStream;
  
  // Check for iOS Safari (not Chrome/Firefox on iOS)
  const isIOSSafari = isIOSDevice && /safari/.test(ua) && !/crios|fxios/.test(ua);
  
  return (isIOSDevice || isIOSSafari) && isNotWindowsPhone;
}

/**
 * Gets comprehensive PWA status information for debugging
 */
export function getPWAStatus() {
  if (typeof window === 'undefined') {
    return {
      isStandalone: false,
      isIOS: false,
      isIOSPWA: false,
      displayMode: 'browser' as const,
      userAgent: 'server',
    };
  }

  return {
    isStandalone: isStandalone(),
    isIOS: isIOS(),
    isIOSPWA: isIOSPWA(),
    displayMode: getDisplayMode(),
    userAgent: navigator.userAgent,
    shouldPreventRedirects: shouldPreventRedirects(),
  };
}
