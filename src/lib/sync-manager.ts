import { getDB, SyncQueueItem, SyncStatus } from './db';
import { trpc } from './trpc';

export type SyncEvent = 'start' | 'progress' | 'complete' | 'error' | 'conflict';

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
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Public methods
  async startSync(): Promise<void> {
    if (this.isRunning) {
      console.log('Sync already running');
      return;
    }

    if (!navigator.onLine) {
      console.log('Offline - cannot sync');
      return;
    }

    this.isRunning = true;
    this.emit('start');

    try {
      await this.updateSyncStatus({ isSyncing: true });
      
      const pendingItems = await getDB().getPendingSyncItems();
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
          await getDB().removeFromSyncQueue(item.id);
          await getDB().updateEntitySyncStatus(item.entityType, item.entityId, 'synced');
          
          progress.completed++;
          this.emit('progress', progress);
        } catch (error) {
          console.error(`Failed to sync ${item.entityType} ${item.entityId}:`, error);
          
          // Increment retry count
          await getDB().syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });
          
          progress.failed++;
          this.emit('progress', progress);
        }
      }

      await this.updateSyncStatus({ 
        isSyncing: false, 
        lastSyncAt: Date.now(),
        pendingCount: await getDB().getPendingCount(),
        failedCount: await getDB().getFailedCount(),
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

  private async syncProject(entityId: string, operationType: string, payload: any): Promise<void> {
    // TODO: Implement proper tRPC sync
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
    console.log('Sync operation:', { entityType: 'project', entityId, operationType, payload });
  }

  private async syncTask(entityId: string, operationType: string, payload: any): Promise<void> {
    // TODO: Implement proper tRPC sync
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
    console.log('Sync task operation:', { entityId, operationType, payload });
  }

  private async syncRole(entityId: string, operationType: string, payload: any): Promise<void> {
    // Roles are typically managed server-side, but we can handle updates
    if (operationType === 'update') {
      // Handle role updates if needed
      console.log('Role update not implemented yet');
    }
  }

  async addToSyncQueue(
    entityType: 'task' | 'project' | 'role',
    entityId: string,
    operationType: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<void> {
    await getDB().addToSyncQueue(entityType, entityId, operationType, payload);
    await this.updateSyncStatus({ pendingCount: await getDB().getPendingCount() });
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    return getDB().getSyncStatus();
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
    await getDB().updateSyncStatus(updates);
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
      const table = db[entityType + 's' as keyof typeof db] as any;
      await table.put(serverItem);
      return serverItem;
    } else {
      // Local version is newer, keep it and sync to server
      return localItem;
    }
  }
}

// Create and export singleton instance
export const syncManager = new SyncManager();
