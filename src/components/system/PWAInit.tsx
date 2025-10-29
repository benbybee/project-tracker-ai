'use client';
import { useEffect } from 'react';
import { registerSW } from '@/lib/pwa-register';

/**
 * PWA initializer for service worker update handling.
 * Service worker is auto-registered by next-pwa in production.
 */
export default function PWAInit() {
  useEffect(() => {
    registerSW();
  }, []);

  return null;
}
