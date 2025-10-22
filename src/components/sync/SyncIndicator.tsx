'use client';
import { useEffect, useState } from 'react';
import { onSyncStatus, getStatus, pushAndPull } from '@/lib/sync-manager';

export default function SyncIndicator() {
  const [status, setStatus] = useState(getStatus());
  useEffect(() => {
    const unsubscribe = onSyncStatus(setStatus);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // basic dot
  const color = status === 'syncing' ? 'bg-blue-500 animate-pulse'
              : status === 'error'   ? 'bg-red-500'
              : 'bg-gray-400';

  return (
    <button
      className="inline-flex items-center gap-2 text-sm"
      onClick={() => pushAndPull()}
      title="Sync now"
    >
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="hidden sm:inline">Sync</span>
    </button>
  );
}
