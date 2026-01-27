'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user is on a touch device
 * Uses both CSS media query (pointer: coarse) and user agent detection
 * for maximum accuracy across devices
 */
export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Method 1: CSS media query (most reliable)
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const finePointer = window.matchMedia('(pointer: fine)');

    // Method 2: User agent check (fallback)
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    );

    // Method 3: Touch events support
    const hasTouchEvents =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Combine all methods for best accuracy
    // Treat hybrid devices with a fine pointer as non-touch for drag behavior
    const isTouch =
      (coarsePointer.matches && !finePointer.matches) ||
      (isMobileUA && hasTouchEvents && !finePointer.matches);

    setIsTouchDevice(isTouch);

    // Listen for changes (e.g., device orientation change)
    const handler = () => {
      const nextIsTouch =
        (coarsePointer.matches && !finePointer.matches) ||
        (isMobileUA && hasTouchEvents && !finePointer.matches);
      setIsTouchDevice(nextIsTouch);
    };

    coarsePointer.addEventListener('change', handler);
    finePointer.addEventListener('change', handler);

    return () => {
      coarsePointer.removeEventListener('change', handler);
      finePointer.removeEventListener('change', handler);
    };
  }, []);

  return isTouchDevice;
}

/**
 * Hook to detect if viewport is mobile-sized (< 1024px)
 * Used for showing/hiding mobile-specific UI elements
 */
export function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');

    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return isMobile;
}
