'use client';
import { useEffect } from 'react';
import { registerSW } from '@/lib/pwa-register';
import {
  preventIOSBounce,
  isStandalone,
  getDisplayMode,
} from '@/lib/pwa-utils';
import { logger } from '@/lib/logger';

/**
 * PWA initializer for service worker update handling and iOS-specific fixes.
 * Service worker is auto-registered by next-pwa in production.
 */
export default function PWAInit() {
  useEffect(() => {
    // Register service worker update handler
    registerSW();

    // Log PWA status
    const standalone = isStandalone();
    const displayMode = getDisplayMode();

    logger.info('PWA Status', {
      standalone,
      displayMode,
      userAgent: navigator.userAgent,
    });

    // Apply iOS-specific fixes
    if (standalone) {
      preventIOSBounce();

      // Add class to body for PWA-specific styling
      document.body.classList.add('pwa-standalone');

      // Set viewport height for iOS
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);

      return () => {
        window.removeEventListener('resize', setViewportHeight);
      };
    }
  }, []);

  return null;
}
