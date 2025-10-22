'use client';
import { useEffect } from 'react';
import { registerSW } from '@/lib/pwa-register';

/**
 * Client-only initializer for Service Worker.
 * Intentionally **no toasts** for offline/ready/etc.
 */
export default function PWAInit() {
  useEffect(() => {
    registerSW();
  }, []);
  return null;
}
