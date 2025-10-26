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
        console.log('[SyncProvider] Dexie database initialized');
        
        // Initialize sync status with proper ID
        try {
          await db.syncStatus.put({
            id: 'global', // Add an ID for the syncStatus object
            isOnline: navigator.onLine,
            isSyncing: false,
            pendingCount: 0,
            failedCount: 0,
            lastSyncAt: new Date(),
          });
        } catch (dbError) {
          console.warn('[SyncProvider] Failed to initialize sync status (non-critical):', dbError);
        }

        // Initialize SyncManager lazily
        try {
          const { createSyncManager } = await import('@/lib/sync-manager.client');
          const syncManager = await createSyncManager();
          
          // Start sync manager
          syncManager.on('start', () => {
            console.log('[SyncProvider] Sync started');
          });
          
          syncManager.on('complete', (progress) => {
            console.log('[SyncProvider] Sync completed:', progress);
          });
          
          syncManager.on('error', (error) => {
            console.warn('[SyncProvider] Sync error (non-critical):', error);
          });
          
          console.log('[SyncProvider] SyncManager initialized');
        } catch (syncError) {
          console.warn('[SyncProvider] SyncManager initialization failed (non-critical):', syncError);
        }
      } catch (error) {
        console.warn('[SyncProvider] Database initialization failed (non-critical):', error);
        // Don't throw - allow the app to continue even if IndexedDB fails
      }
    };

    // Run initialization asynchronously without blocking render
    initializeDB().catch((err) => {
      console.warn('[SyncProvider] Async initialization error (non-critical):', err);
    });
  }, []);

  // Always render children, even if DB initialization fails
  return (
    <>
      {children}
    </>
  );
}
