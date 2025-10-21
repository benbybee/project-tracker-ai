'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync-manager';
import { OfflineToast } from '@/components/ui/offline-toast';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the database
    const initializeDB = async () => {
      try {
        // Open the database
        await db().open();
        console.log('Dexie database initialized');
        
        // Initialize sync status
        await db().syncStatus.put({
          isOnline: navigator.onLine,
          isSyncing: false,
          pendingCount: 0,
          failedCount: 0,
        });
        
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
        
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeDB();

    // Cleanup on unmount
    return () => {
      // Close database connection
      db().close();
    };
  }, []);

  return (
    <>
      {children}
      <OfflineToast />
    </>
  );
}
