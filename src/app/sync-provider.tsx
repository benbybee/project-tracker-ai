'use client';

import { useEffect, useRef } from 'react';
import { getDB, isBrowser } from '@/lib/db.client';
import { logger } from '@/lib/logger';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    if (!isBrowser() || started.current) return;
    started.current = true;

    const initializeDB = async () => {
      try {
        // Initialize the database lazily
        const db = await getDB();
        logger.debug('Dexie database initialized');

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
          logger.warn('Failed to initialize sync status (non-critical)', {
            error: String(dbError),
          });
        }

        // Initialize SyncManager lazily
        try {
          const { createSyncManager } = await import(
            '@/lib/sync-manager.client'
          );
          const syncManager = await createSyncManager();

          // Start sync manager
          syncManager.on('start', () => {
            logger.debug('Sync started');
          });

          syncManager.on('complete', (progress) => {
            logger.debug('Sync completed', { progress });
          });

          syncManager.on('error', (error) => {
            logger.warn('Sync error (non-critical)', { error: String(error) });
          });

          logger.debug('SyncManager initialized');
        } catch (syncError) {
          logger.warn('SyncManager initialization failed (non-critical)', {
            error: String(syncError),
          });
        }
      } catch (error) {
        logger.warn('Database initialization failed (non-critical)', {
          error: String(error),
        });
        // Don't throw - allow the app to continue even if IndexedDB fails
      }
    };

    // Run initialization asynchronously without blocking render
    initializeDB().catch((err) => {
      logger.warn('Async initialization error (non-critical)', err);
    });
  }, []);

  // Always render children, even if DB initialization fails
  return <>{children}</>;
}
