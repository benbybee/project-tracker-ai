// Optional placeholder to ensure no offline toasts leak from sync logic.
// If you already have a real useSync, remove any toast calls there.
import { useEffect } from 'react';

export function useSync() {
  // If you have real sync logic, keep it.
  // This placeholder intentionally does **not** show any toasts.
  useEffect(() => {
    // Example:
    // if (!navigator.onLine) { /* previously showed toast — removed */ }
  }, []);
}
