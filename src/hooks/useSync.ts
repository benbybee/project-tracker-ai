'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncProgress } from '@/lib/sync-manager';
import { getDB, SyncStatus } from '@/lib/db';
// Custom online status hook
function useOnline() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
  const isOnline = useOnline();

  // Load initial sync status
  useEffect(() => {
    const loadSyncStatus = async () => {
      const status = await getDB().getSyncStatus();
      setSyncStatus(status);
    };
    loadSyncStatus();
  }, []);

  // Listen for sync events
  useEffect(() => {
    const unsubscribeStart = syncManager.on('start', () => {
      setIsSyncing(true);
    });

    const unsubscribeProgress = syncManager.on('progress', (progress: SyncProgress) => {
      setSyncProgress(progress);
    });

    const unsubscribeComplete = syncManager.on('complete', (progress: SyncProgress) => {
      setIsSyncing(false);
      setSyncProgress(null);
      // Refresh sync status
      getDB().getSyncStatus().then(setSyncStatus);
    });

    const unsubscribeError = syncManager.on('error', (error: any) => {
      setIsSyncing(false);
      setSyncProgress(null);
      console.error('Sync error:', error);
    });

    return () => {
      unsubscribeStart();
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
    };
  }, []);

  // Update sync status when online status changes
  useEffect(() => {
    const updateStatus = async () => {
      await getDB().updateSyncStatus({ isOnline });
      const status = await getDB().getSyncStatus();
      setSyncStatus(status);
    };
    updateStatus();
  }, [isOnline]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    if (isSyncing) {
      throw new Error('Sync already in progress');
    }
    await syncManager.startSync();
  }, [isOnline, isSyncing]);

  // Add item to sync queue
  const addToSyncQueue = useCallback(async (
    entityType: 'task' | 'project' | 'role',
    entityId: string,
    operationType: 'create' | 'update' | 'delete',
    payload: any
  ) => {
    await syncManager.addToSyncQueue(entityType, entityId, operationType, payload);
    // Refresh sync status
    const status = await getDB().getSyncStatus();
    setSyncStatus(status);
  }, []);

  // Get pending count
  const getPendingCount = useCallback(async () => {
    return getDB().getPendingCount();
  }, []);

  // Get failed count
  const getFailedCount = useCallback(async () => {
    return getDB().getFailedCount();
  }, []);

  return {
    syncStatus,
    syncProgress,
    isSyncing,
    isOnline,
    triggerSync,
    addToSyncQueue,
    getPendingCount,
    getFailedCount,
  };
}

// Hook for tracking specific entity sync status
export function useEntitySyncStatus(entityType: 'task' | 'project' | 'role', entityId: string) {
  const [syncStatus, setSyncStatus] = useState<'pending' | 'synced' | 'failed'>('synced');

  useEffect(() => {
    const checkSyncStatus = async () => {
      const table = db[entityType + 's' as keyof typeof db] as any;
      const item = await table.get(entityId);
      if (item) {
        setSyncStatus(item.syncStatus);
      }
    };
    checkSyncStatus();
  }, [entityType, entityId]);

  return syncStatus;
}

// Hook for offline operations
export function useOfflineOperations() {
  const { addToSyncQueue, isOnline } = useSync();

  const createOffline = useCallback(async (
    entityType: 'task' | 'project' | 'role',
    payload: any
  ) => {
    const entityId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to local database
    const table = db[entityType + 's' as keyof typeof db] as any;
    await table.add({
      id: entityId,
      ...payload,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Add to sync queue
    await addToSyncQueue(entityType, entityId, 'create', payload);
    
    return entityId;
  }, [addToSyncQueue]);

  const updateOffline = useCallback(async (
    entityType: 'task' | 'project' | 'role',
    entityId: string,
    updates: any
  ) => {
    // Update local database
    const table = db[entityType + 's' as keyof typeof db] as any;
    await table.update(entityId, {
      ...updates,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    // Add to sync queue
    await addToSyncQueue(entityType, entityId, 'update', updates);
  }, [addToSyncQueue]);

  const deleteOffline = useCallback(async (
    entityType: 'task' | 'project' | 'role',
    entityId: string
  ) => {
    // Mark as deleted in local database
    const table = db[entityType + 's' as keyof typeof db] as any;
    await table.update(entityId, {
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    // Add to sync queue
    await addToSyncQueue(entityType, entityId, 'delete', {});
  }, [addToSyncQueue]);

  return {
    createOffline,
    updateOffline,
    deleteOffline,
    isOnline,
  };
}
