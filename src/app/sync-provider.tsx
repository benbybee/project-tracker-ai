'use client';

import { useEffect, useRef } from 'react';
import { getDB, isBrowser } from '@/lib/db.client';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    if (!isBrowser() || started.current) return;
    started.current = true;

    const initializeDB = async () => {
      try {
        // Initialize the database lazily
        const db = await getDB();
        console.log('Dexie database initialized');
        
        // Initialize sync status
        await db.syncStatus.put({
          isOnline: navigator.onLine,
          isSyncing: false,
          pendingCount: 0,
          failedCount: 0,
        });

        // Initialize SyncManager lazily
        const { createSyncManager } = await import('@/lib/sync-manager.client');
        const syncManager = await createSyncManager();
        
        // Start sync manager
        syncManager.on('start', () => {
          console.log('Sync started');
        });
        
        syncManager.on('complete', (progress) => {
          console.log('Sync completed:', progress);
        });
        
        syncManager.on('error', (error) => {
          console.error('Sync error:', error);
        });
        
        console.log('SyncManager initialized');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeDB();
  }, []);

  return (
    <>
      {children}
    </>
  );
}
