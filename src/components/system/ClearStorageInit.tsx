'use client';

import { useEffect } from 'react';

/**
 * Initializes the clear storage utility in the browser console
 * This makes window.clearAppStorage() available globally for debugging
 */
export default function ClearStorageInit() {
  useEffect(() => {
    // Clear storage utility intentionally disabled
    // Can be re-enabled by creating @/lib/clear-local-storage
  }, []);

  return null; // This component renders nothing
}
