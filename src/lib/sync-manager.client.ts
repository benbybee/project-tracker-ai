// Client-only sync manager with lazy imports
import { getDB, SyncQueueItem, SyncStatus } from './db.client';
import { logger } from './logger';

export type SyncEvent =
  | 'start'
  | 'progress'
  | 'complete'
  | 'error'
  | 'conflict';

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

class SyncManager {
  private isRunning = false;
  private listeners: Map<SyncEvent, Set<(data?: any) => void>> = new Map();
  private retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

  constructor() {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Initialize sync status
    this.updateSyncStatus({ isOnline: navigator.onLine });
  }

  // Event emitter methods
  on(event: SyncEvent, callback: (data?: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: SyncEvent, data?: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  // Public methods
  async startSync(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Sync already running');
      return;
    }

    if (!navigator.onLine) {
      logger.debug('Offline - cannot sync');
      return;
    }

    this.isRunning = true;
    this.emit('start');

    try {
      await this.updateSyncStatus({ isSyncing: true });

      const db = await getDB();
      const pendingItems = await db.syncQueue
        .where('retryCount')
        .below(5)
        .toArray();
      const progress: SyncProgress = {
        total: pendingItems.length,
        completed: 0,
        failed: 0,
      };

      this.emit('progress', progress);

      for (const item of pendingItems) {
        try {
          progress.current = `${item.entityType} ${item.operationType}`;
          this.emit('progress', progress);

          await this.syncItem(item);
          await db.syncQueue.delete(item.id);

          // Update entity sync status
          const table = db[(item.entityType + 's') as keyof typeof db] as any;
          await table.update(item.entityId, { syncStatus: 'synced' });

          progress.completed++;
          this.emit('progress', progress);
        } catch (error) {
          console.error(
            `Failed to sync ${item.entityType} ${item.entityId}:`,
            error
          );

          // Increment retry count
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });

          progress.failed++;
          this.emit('progress', progress);
        }
      }

      await this.updateSyncStatus({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        pendingCount: await db.getPendingCount(),
        failedCount: await db.getFailedCount(),
      });

      this.emit('complete', progress);
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('error', error);
    } finally {
      this.isRunning = false;
      await this.updateSyncStatus({ isSyncing: false });
    }
  }

  async syncItem(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId, operationType, payload } = item;

    switch (entityType) {
      case 'project':
        await this.syncProject(entityId, operationType, payload);
        break;
      case 'task':
        await this.syncTask(entityId, operationType, payload);
        break;
      case 'role':
        await this.syncRole(entityId, operationType, payload);
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  private async syncProject(
    _entityId: string,
    _operationType: string,
    _payload: any
  ): Promise<void> {
    // TODO: Implement proper tRPC sync with lazy import
    // const { trpc } = await import('./trpc');
    // switch (operationType) {
    //   case 'create':
    //     await trpc.projects.create.mutate(payload);
    //     break;
    //   case 'update':
    //     await trpc.projects.update.mutate({ id: entityId, ...payload });
    //     break;
    //   case 'delete':
    //     await trpc.projects.remove.mutate({ id: entityId });
    //     break;
    // }
    // Placeholder: actual sync will be implemented with tRPC
  }

  private async syncTask(
    entityId: string,
    operationType: string,
    payload: any
  ): Promise<void> {
    // TODO: Implement proper tRPC sync with lazy import
    // const { trpc } = await import('./trpc');
    // switch (operationType) {
    //   case 'create':
    //     await trpc.tasks.create.mutate(payload);
    //     break;
    //   case 'update':
    //     await trpc.tasks.update.mutate({ id: entityId, ...payload });
    //     break;
    //   case 'delete':
    //     await trpc.tasks.remove.mutate({ id: entityId });
    //     break;
    // }
    logger.debug('Sync task operation:', { entityId, operationType, payload });
  }

  private async syncRole(
    _entityId: string,
    operationType: string,
    _payload: any
  ): Promise<void> {
    // Roles are typically managed server-side, but we can handle updates
    if (operationType === 'update') {
      // Handle role updates if needed
      logger.debug('Role update not implemented yet');
    }
  }

  async addToSyncQueue(
    entityType: 'task' | 'project' | 'role',
    entityId: string,
    operationType: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<void> {
    const db = await getDB();
    await db.syncQueue.add({
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      operationType,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });
    await this.updateSyncStatus({ pendingCount: await db.getPendingCount() });
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    const db = await getDB();
    return db.getSyncStatus();
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async hasPendingSync(): Promise<boolean> {
    const status = await this.getSyncStatus();
    return (status?.pendingCount || 0) > 0;
  }

  // Private methods
  private async handleOnline(): Promise<void> {
    await this.updateSyncStatus({ isOnline: true });

    // Auto-sync when coming back online
    if (await this.hasPendingSync()) {
      setTimeout(() => this.startSync(), 1000);
    }
  }

  private async handleOffline(): Promise<void> {
    await this.updateSyncStatus({ isOnline: false });
  }

  private async updateSyncStatus(updates: Partial<SyncStatus>): Promise<void> {
    const db = await getDB();
    await db.updateSyncStatus(updates);
  }

  // Conflict resolution
  async resolveConflict(
    entityType: 'task' | 'project' | 'role',
    localItem: any,
    serverItem: any
  ): Promise<any> {
    // Compare timestamps
    const localTime = new Date(localItem.updatedAt).getTime();
    const serverTime = new Date(serverItem.updatedAt).getTime();

    if (serverTime > localTime) {
      // Server version is newer, use it
      const db = await getDB();
      const table = db[(entityType + 's') as keyof typeof db] as any;
      await table.put(serverItem);
      return serverItem;
    } else {
      // Local version is newer, keep it and sync to server
      return localItem;
    }
  }
}

// Export the class and a function to create instances
export { SyncManager };

export async function createSyncManager() {
  await getDB();
  return new SyncManager();
}

// Wire service worker messages for sync coordination
export function wireServiceWorkerMessages() {
  if (typeof window === 'undefined' || !navigator.serviceWorker) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, data } = event.data || {};

    switch (type) {
      case 'SYNC_REQUEST':
        // Handle sync requests from service worker
        logger.debug('Service worker requested sync:', data);
        break;
      case 'OFFLINE_DETECTED':
        // Handle offline detection from service worker
        logger.debug('Service worker detected offline state');
        break;
      case 'ONLINE_DETECTED':
        // Handle online detection from service worker
        logger.debug('Service worker detected online state');
        break;
    }
  });
}

// Start fallback interval for periodic sync attempts
export function startFallbackInterval(intervalMs: number = 30000) {
  if (typeof window === 'undefined') return;

  const intervalId = setInterval(async () => {
    try {
      const { createSyncManager } = await import('./sync-manager.client');
      const manager = await createSyncManager();

      // Only attempt sync if online and has pending items
      if (navigator.onLine && (await manager.hasPendingSync())) {
        logger.debug('Fallback sync attempt...');
        await manager.startSync();
      }
    } catch (error) {
      console.warn('Fallback sync failed:', error);
    }
  }, intervalMs);

  // Store interval ID for potential cleanup
  (window as any).__TT_FALLBACK_INTERVAL__ = intervalId;
}
