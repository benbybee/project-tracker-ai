// Client-only database loader with lazy Dexie import
let dbPromise: Promise<any> | null = null;

export const isBrowser = () => typeof window !== "undefined";

export async function getDB() {
  if (!isBrowser()) {
    throw new Error("getDB() called on server - this should only run in the browser");
  }
  
  if (!dbPromise) {
    dbPromise = (async () => {
      const { Dexie } = await import("dexie");
      
      class TaskTrackerDB extends Dexie {
        projects!: Dexie.Table<any>;
        tasks!: Dexie.Table<any>;
        roles!: Dexie.Table<any>;
        syncQueue!: Dexie.Table<any>;
        conflicts!: Dexie.Table<any>;
        activity_log!: Dexie.Table<any>;
        syncStatus!: Dexie.Table<any>;

        constructor() {
          super("tasktracker-v1");
          
          this.version(1).stores({
            projects: "id, updatedAt, syncStatus",
            tasks: "id, projectId, status, updatedAt, syncStatus",
            roles: "id, updatedAt, syncStatus", 
            syncQueue: "id, entityType, entityId, operationType, timestamp",
            conflicts: "id, entityType, entityId, timestamp",
            activity_log: "id, entityType, entityId, timestamp",
            syncStatus: "id"
          });

          // Add hooks for automatic sync status tracking
          this.projects.hook('creating', (primKey, obj, trans) => {
            (obj as any).syncStatus = 'pending';
            (obj as any).updatedAt = new Date().toISOString();
          });

          this.projects.hook('updating', (modifications, primKey, obj, trans) => {
            (modifications as any).syncStatus = 'pending';
            (modifications as any).updatedAt = new Date().toISOString();
          });

          this.tasks.hook('creating', (primKey, obj, trans) => {
            (obj as any).syncStatus = 'pending';
            (obj as any).updatedAt = new Date().toISOString();
          });

          this.tasks.hook('updating', (modifications, primKey, obj, trans) => {
            (modifications as any).syncStatus = 'pending';
            (modifications as any).updatedAt = new Date().toISOString();
          });

          this.roles.hook('creating', (primKey, obj, trans) => {
            (obj as any).syncStatus = 'pending';
            (obj as any).updatedAt = new Date().toISOString();
          });

          this.roles.hook('updating', (modifications, primKey, obj, trans) => {
            (modifications as any).syncStatus = 'pending';
            (modifications as any).updatedAt = new Date().toISOString();
          });
        }

        // Helper methods for sync status
        async getPendingCount(): Promise<number> {
          const projects = await this.projects.where('syncStatus').equals('pending').count();
          const tasks = await this.tasks.where('syncStatus').equals('pending').count();
          const roles = await this.roles.where('syncStatus').equals('pending').count();
          return projects + tasks + roles;
        }

        async getFailedCount(): Promise<number> {
          const projects = await this.projects.where('syncStatus').equals('failed').count();
          const tasks = await this.tasks.where('syncStatus').equals('failed').count();
          const roles = await this.roles.where('syncStatus').equals('failed').count();
          return projects + tasks + roles;
        }

        async getSyncStatus() {
          return await this.syncStatus.get('main') || {
            isOnline: navigator.onLine,
            isSyncing: false,
            pendingCount: 0,
            failedCount: 0,
          };
        }

        async updateSyncStatus(status: any) {
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
      }

      const db = new TaskTrackerDB();
      await db.open();
      
      // Initialize sync status only on client side
      await db.syncStatus.put({
        isOnline: navigator.onLine,
        isSyncing: false,
        pendingCount: 0,
        failedCount: 0,
      }).catch(console.error);
      
      return db;
    })();
  }
  
  return dbPromise;
}

// Export types for use in other files
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt?: string;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'task' | 'project' | 'role';
  entityId: string;
  operationType: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string;
  retryCount: number;
}
