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
    const mediaQuery = window.matchMedia('(pointer: coarse)');

    // Method 2: User agent check (fallback)
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    );

    // Method 3: Touch events support
    const hasTouchEvents =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Combine all methods for best accuracy
    const isTouch = mediaQuery.matches || (isMobileUA && hasTouchEvents);

    setIsTouchDevice(isTouch);

    // Listen for changes (e.g., device orientation change)
    const handler = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches || (isMobileUA && hasTouchEvents));
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
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
