'use client';

import { useEffect } from 'react';

/**
 * Initializes the clear storage utility in the browser console
 * This makes window.clearAppStorage() available globally for debugging
 */
export default function ClearStorageInit() {
  useEffect(() => {
    // Dynamically import the clear storage utility
    import('@/lib/clear-local-storage').catch((err) => {
      console.error('Failed to load clear storage utility:', err);
    });
  }, []);

  return null; // This component renders nothing
}
