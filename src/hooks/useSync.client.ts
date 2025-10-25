'use client';

import { useState, useEffect, useCallback } from 'react';
import { SyncProgress } from '@/lib/sync-manager.client';
import { getDB, SyncStatus, isBrowser } from '@/lib/db.client';

// Custom online status hook
function useOnline() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (!isBrowser()) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncManager, setSyncManager] = useState<any>(null);
  const isOnline = useOnline();

  // Load sync status and manager on mount
  useEffect(() => {
    if (!isBrowser()) return;

    const loadSyncStatus = async () => {
      try {
        const db = await getDB();
        const status = await db.getSyncStatus();
        setSyncStatus(status);

        // Load sync manager lazily
        const { createSyncManager } = await import('@/lib/sync-manager.client');
        const manager = await createSyncManager();
        setSyncManager(manager);

        // Set up event listeners
        manager.on('start', () => {
          setIsSyncing(true);
          setSyncProgress(null);
        });

        manager.on('progress', (progress: SyncProgress) => {
          setSyncProgress(progress);
        });

        manager.on('complete', (progress: SyncProgress) => {
          setIsSyncing(false);
          setSyncProgress(null);

          // Update sync status
          db.getSyncStatus().then(setSyncStatus);
        });

        manager.on('error', (error: any) => {
          setIsSyncing(false);
          setSyncProgress(null);
          console.error('Sync error:', error);
        });
      } catch (error) {
        console.error('Failed to load sync status:', error);
      }
    };

    loadSyncStatus();
  }, []);

  const startSync = useCallback(async () => {
    if (!syncManager) return;

    try {
      await syncManager.startSync();
    } catch (error) {
      console.error('Failed to start sync:', error);
    }
  }, [syncManager]);

  const addToSyncQueue = useCallback(
    async (
      entityType: 'task' | 'project' | 'role',
      entityId: string,
      operationType: 'create' | 'update' | 'delete',
      payload: any
    ) => {
      if (!syncManager) return;

      try {
        await syncManager.addToSyncQueue(
          entityType,
          entityId,
          operationType,
          payload
        );
      } catch (error) {
        console.error('Failed to add to sync queue:', error);
      }
    },
    [syncManager]
  );

  return {
    isOnline,
    syncStatus,
    syncProgress,
    isSyncing,
    startSync,
    addToSyncQueue,
    hasPendingSync: syncStatus?.pendingCount
      ? syncStatus.pendingCount > 0
      : false,
    hasFailedSync: syncStatus?.failedCount ? syncStatus.failedCount > 0 : false,
  };
}

export function useEntitySyncStatus(
  entityType: 'task' | 'project' | 'role',
  entityId: string
) {
  const [syncStatus, setSyncStatus] = useState<'pending' | 'synced' | 'failed'>(
    'synced'
  );

  useEffect(() => {
    if (!isBrowser()) return;

    const checkSyncStatus = async () => {
      try {
        const db = await getDB();
        const table = db[(entityType + 's') as keyof typeof db] as any;
        const item = await table.get(entityId);
        if (item) {
          setSyncStatus(item.syncStatus);
        }
      } catch (error) {
        console.error('Failed to check sync status:', error);
      }
    };

    checkSyncStatus();
  }, [entityType, entityId]);

  return syncStatus;
}

export function useOfflineOperations() {
  const [syncManager, setSyncManager] = useState<any>(null);

  useEffect(() => {
    if (!isBrowser()) return;

    const loadSyncManager = async () => {
      try {
        const { createSyncManager } = await import('@/lib/sync-manager.client');
        const manager = await createSyncManager();
        setSyncManager(manager);
      } catch (error) {
        console.error('Failed to load sync manager:', error);
      }
    };

    loadSyncManager();
  }, []);

  const createOffline = useCallback(
    async (entityType: 'task' | 'project' | 'role', payload: any) => {
      const entityId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add to local database
      try {
        const db = await getDB();
        const table = db[(entityType + 's') as keyof typeof db] as any;
        await table.add({
          id: entityId,
          ...payload,
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Add to ops queue using the new system
        const { enqueueOp } = await import('@/lib/ops-helpers');
        await enqueueOp({
          entityType: entityType as 'task' | 'project',
          entityId,
          action: 'create',
          payload,
          projectId: payload.projectId,
          baseVersion: 0,
        });

        return entityId;
      } catch (error) {
        console.error('Failed to create offline:', error);
        throw error;
      }
    },
    []
  );

  const updateOffline = useCallback(
    async (
      entityType: 'task' | 'project' | 'role',
      entityId: string,
      updates: any
    ) => {
      try {
        const db = await getDB();
        const table = db[(entityType + 's') as keyof typeof db] as any;
        const existing = await table.get(entityId);

        await table.update(entityId, {
          ...updates,
          syncStatus: 'pending',
          updatedAt: new Date().toISOString(),
        });

        // Add to ops queue using the new system
        const { enqueueOp } = await import('@/lib/ops-helpers');
        await enqueueOp({
          entityType: entityType as 'task' | 'project',
          entityId,
          action: 'update',
          payload: updates,
          projectId: updates.projectId || existing?.projectId,
          baseVersion: existing?.updatedAt
            ? new Date(existing.updatedAt).getTime()
            : undefined,
        });
      } catch (error) {
        console.error('Failed to update offline:', error);
        throw error;
      }
    },
    []
  );

  const deleteOffline = useCallback(
    async (entityType: 'task' | 'project' | 'role', entityId: string) => {
      try {
        const db = await getDB();
        const table = db[(entityType + 's') as keyof typeof db] as any;
        const existing = await table.get(entityId);

        await table.update(entityId, {
          syncStatus: 'pending',
          updatedAt: new Date().toISOString(),
        });

        // Add to ops queue using the new system
        const { enqueueOp } = await import('@/lib/ops-helpers');
        await enqueueOp({
          entityType: entityType as 'task' | 'project',
          entityId,
          action: 'delete',
          payload: {},
          projectId: existing?.projectId,
        });
      } catch (error) {
        console.error('Failed to delete offline:', error);
        throw error;
      }
    },
    []
  );

  return {
    createOffline,
    updateOffline,
    deleteOffline,
  };
}
