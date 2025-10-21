import Dexie, { Table } from 'dexie';

export interface Project {
  id: string;
  name: string;
  type: 'general' | 'website';
  description?: string | null;
  roleId?: string | null;
  notes?: string | null;
  pinned: boolean;
  domain?: string | null;
  hostingProvider?: string | null;
  dnsStatus?: string | null;
  goLiveDate?: string | null;
  repoUrl?: string | null;
  stagingUrl?: string | null;
  checklistJson?: any;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface Task {
  id: string;
  projectId: string;
  roleId?: string | null;
  title: string;
  description?: string | null;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'next_steps';
  weekOf?: string | null;
  progress: number;
  dueDate?: string | null;
  isDaily: boolean;
  priorityScore: '1' | '2' | '3' | '4';
  blockedReason?: string | null;
  blockedDetails?: string | null;
  blockedAt?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface Role {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface SyncQueueItem {
  id: string;
  entityType: 'task' | 'project' | 'role';
  entityId: string;
  operationType: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  retryCount: number;
  lastError?: string | null;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt?: number;
}

export class TaskTrackerDB extends Dexie {
  projects!: Table<Project>;
  tasks!: Table<Task>;
  roles!: Table<Role>;
  syncQueue!: Table<SyncQueueItem>;
  syncStatus!: Table<SyncStatus>;

  constructor() {
    super('TaskTrackerDB');
    
    this.version(1).stores({
      projects: 'id, name, type, updatedAt, syncStatus',
      tasks: 'id, projectId, status, updatedAt, syncStatus, position',
      roles: 'id, name, updatedAt, syncStatus',
      syncQueue: 'id, entityType, entityId, operationType, timestamp, retryCount',
      syncStatus: 'id, isOnline, isSyncing, pendingCount, failedCount, lastSyncAt'
    });

    // Add hooks for automatic sync status updates
    this.projects.hook('creating', (primKey, obj, trans) => {
      obj.syncStatus = 'pending';
      obj.updatedAt = new Date().toISOString();
    });

    this.projects.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).syncStatus = 'pending';
      (modifications as any).updatedAt = new Date().toISOString();
    });

    this.tasks.hook('creating', (primKey, obj, trans) => {
      obj.syncStatus = 'pending';
      obj.updatedAt = new Date().toISOString();
    });

    this.tasks.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).syncStatus = 'pending';
      (modifications as any).updatedAt = new Date().toISOString();
    });

    this.roles.hook('creating', (primKey, obj, trans) => {
      obj.syncStatus = 'pending';
      obj.updatedAt = new Date().toISOString();
    });

    this.roles.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).syncStatus = 'pending';
      (modifications as any).updatedAt = new Date().toISOString();
    });
  }

  // Helper methods for sync operations
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return this.syncQueue.orderBy('timestamp').toArray();
  }

  async addToSyncQueue(
    entityType: 'task' | 'project' | 'role',
    entityId: string,
    operationType: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<void> {
    const syncItem: SyncQueueItem = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      operationType,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.syncQueue.add(syncItem);
  }

  async removeFromSyncQueue(syncItemId: string): Promise<void> {
    await this.syncQueue.delete(syncItemId);
  }

  async updateEntitySyncStatus(
    entityType: 'task' | 'project' | 'role',
    entityId: string,
    status: 'pending' | 'synced' | 'failed'
  ): Promise<void> {
    const table = this[entityType + 's' as keyof this] as Table<any>;
    await table.update(entityId, { syncStatus: status });
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    const status = await this.syncStatus.get('main');
    return status || null;
  }

  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    const existing = await this.getSyncStatus();
    const updated = { 
      isOnline: false,
      isSyncing: false,
      pendingCount: 0,
      failedCount: 0,
      ...existing, 
      ...status 
    };
    await this.syncStatus.put(updated);
  }

  async clearSyncQueue(): Promise<void> {
    await this.syncQueue.clear();
  }

  async getPendingCount(): Promise<number> {
    return this.syncQueue.count();
  }

  async getFailedCount(): Promise<number> {
    return this.syncQueue.where('retryCount').above(0).count();
  }
}

// Create and export the database instance
export const db = new TaskTrackerDB();

// Initialize sync status
db.syncStatus.put({
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
}).catch(console.error);
