'use client';
import { useEffect, useState } from 'react';
import { onSyncStatus, getStatus, pushAndPull } from '@/lib/sync-manager';
import { useRealtime } from '@/app/providers';

export default function SyncIndicator() {
  const [status, setStatus] = useState(getStatus());
  const { isConnected: isRealtimeConnected, onlineUsers } = useRealtime();
  
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
              : isRealtimeConnected ? 'bg-green-500'
              : 'bg-gray-400';

  return (
    <button
      className="inline-flex items-center gap-2 text-sm"
      onClick={() => pushAndPull()}
      title={`Sync ${isRealtimeConnected ? `(${onlineUsers.length} online)` : ''}`}
    >
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="hidden sm:inline">Sync</span>
      {isRealtimeConnected && onlineUsers.length > 0 && (
        <span className="hidden sm:inline text-xs text-gray-500">
          ({onlineUsers.length})
        </span>
      )}
    </button>
  );
}
