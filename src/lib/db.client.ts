// Client-only database loader with lazy Dexie import
let dbPromise: Promise<any> | null = null;

export const isBrowser = () => typeof window !== "undefined";

// New types for sync system
export type EntityType = 'task' | 'project';

export type LocalOp = {
  id: string;               // cuid or uuid
  entityType: EntityType;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: any;             // partial entity
  ts: number;               // client timestamp (ms)
  baseVersion?: number;     // server version we edited from (optional)
  userId?: string;          // current user (for audit)
  projectId?: string;       // routing convenience for project-scoped sync
};

export type SyncVector = {
  id: 'global';
  lastPullVersion: number;  // server change number we last pulled
  lastPushAt: number;       // ms
};

export async function getDB() {
  if (!isBrowser()) {
    throw new Error("getDB() called on server - this should only run in the browser");
  }
  
  if (!dbPromise) {
    dbPromise = (async () => {
      const { Dexie } = await import("dexie");
      
      class TaskTrackerDB extends Dexie {
        projects!: any;
        tasks!: any;
        roles!: any;
        syncQueue!: any;
        conflicts!: any;
        activity_log!: any;
        syncStatus!: any;
        opsQueue!: any;
        syncVector!: any;
        notifications!: any;
        offlineMessages!: any;

        constructor() {
          super("tasktracker-v1");
          
          this.version(3).stores({
            projects: "id, updatedAt, syncStatus, version",
            tasks: "id, projectId, status, updatedAt, syncStatus, version",
            roles: "id, updatedAt, syncStatus", 
            syncQueue: "id, entityType, entityId, operationType, timestamp",
            conflicts: "id, entityType, entityId, timestamp",
            activity_log: "id, entityType, entityId, timestamp",
            syncStatus: "id",
            opsQueue: "id, entityType, entityId, projectId, ts",
            syncVector: "id",
            notifications: "id, userId, type, read, updatedAt, syncStatus",
            offlineMessages: "id, threadId, content, messageType, metadata, retryCount, createdAt"
          });

          // Add hooks for automatic sync status tracking and version management
          this.projects.hook('creating', (primKey: any, obj: any, trans: any) => {
            (obj as any).syncStatus = 'pending';
            (obj as any).updatedAt = new Date().toISOString();
            (obj as any).version = 1;
          });

          this.projects.hook('updating', (modifications: any, primKey: any, obj: any, trans: any) => {
            (modifications as any).syncStatus = 'pending';
            (modifications as any).updatedAt = new Date().toISOString();
            (modifications as any).version = (obj as any).version + 1;
          });

          this.tasks.hook('creating', (primKey: any, obj: any, trans: any) => {
            (obj as any).syncStatus = 'pending';
            (obj as any).updatedAt = new Date().toISOString();
            (obj as any).version = 1;
          });

          this.tasks.hook('updating', (modifications: any, primKey: any, obj: any, trans: any) => {
            (modifications as any).syncStatus = 'pending';
            (modifications as any).updatedAt = new Date().toISOString();
            (modifications as any).version = (obj as any).version + 1;
          });

          this.roles.hook('creating', (primKey: any, obj: any, trans: any) => {
            (obj as any).syncStatus = 'pending';
            (obj as any).updatedAt = new Date().toISOString();
          });

          this.roles.hook('updating', (modifications: any, primKey: any, obj: any, trans: any) => {
            (modifications as any).syncStatus = 'pending';
            (modifications as any).updatedAt = new Date().toISOString();
          });

          this.notifications.hook('creating', (primKey: any, obj: any, trans: any) => {
            (obj as any).syncStatus = 'pending';
            (obj as any).updatedAt = new Date().toISOString();
          });

          this.notifications.hook('updating', (modifications: any, primKey: any, obj: any, trans: any) => {
            (modifications as any).syncStatus = 'pending';
            (modifications as any).updatedAt = new Date().toISOString();
          });
        }

        // Helper methods for sync status
        async getPendingCount(): Promise<number> {
          const projects = await this.projects.where('syncStatus').equals('pending').count();
          const tasks = await this.tasks.where('syncStatus').equals('pending').count();
          const roles = await this.roles.where('syncStatus').equals('pending').count();
          const notifications = await this.notifications.where('syncStatus').equals('pending').count();
          return projects + tasks + roles + notifications;
        }

        async getFailedCount(): Promise<number> {
          const projects = await this.projects.where('syncStatus').equals('failed').count();
          const tasks = await this.tasks.where('syncStatus').equals('failed').count();
          const roles = await this.roles.where('syncStatus').equals('failed').count();
          const notifications = await this.notifications.where('syncStatus').equals('failed').count();
          return projects + tasks + roles + notifications;
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

        // Notification helper methods
        async getUnreadNotificationCount(): Promise<number> {
          return await this.notifications.where('read').equals(false).count();
        }

        async getNotifications(limit: number = 20, offset: number = 0) {
          return await this.notifications
            .orderBy('updatedAt')
            .reverse()
            .offset(offset)
            .limit(limit)
            .toArray();
        }

        async markNotificationAsRead(id: string) {
          await this.notifications.update(id, { 
            read: true, 
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending'
          });
        }

        async markAllNotificationsAsRead() {
          await this.notifications
            .where('read')
            .equals(false)
            .modify({ 
              read: true, 
              updatedAt: new Date().toISOString(),
              syncStatus: 'pending'
            });
        }

        async storeNotification(notification: any) {
          await this.notifications.put({
            ...notification,
            syncStatus: 'pending',
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        }

        // Offline message helper methods
        async storeOfflineMessage(message: any) {
          await this.offlineMessages.put({
            id: message.id || `offline_${Date.now()}_${Math.random()}`,
            threadId: message.threadId,
            content: message.content,
            messageType: message.messageType || 'text',
            metadata: message.metadata,
            retryCount: 0,
            createdAt: new Date().toISOString()
          });
        }

        async getOfflineMessages() {
          return await this.offlineMessages
            .orderBy('createdAt')
            .toArray();
        }

        async removeOfflineMessage(id: string) {
          await this.offlineMessages.delete(id);
        }

        async incrementRetryCount(id: string) {
          const message = await this.offlineMessages.get(id);
          if (message) {
            await this.offlineMessages.update(id, {
              retryCount: message.retryCount + 1
            });
          }
        }

        async clearOfflineMessages() {
          await this.offlineMessages.clear();
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
