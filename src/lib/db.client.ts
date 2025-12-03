/**
 * Client-side database stub for offline support
 * TODO: Implement IndexedDB or similar for offline functionality
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function getDB() {
  // Placeholder for client-side database
  // This should be implemented with IndexedDB or similar
  return {
    storeOfflineMessage: async (_message?: any) => {
      console.warn('Offline storage not implemented');
    },
    getOfflineMessages: async (_threadId?: string): Promise<any[]> => [],
    clearOfflineMessages: async (_threadId?: string) => {
      console.warn('Offline storage not implemented');
    },
    removeOfflineMessage: async (_messageId?: string) => {
      console.warn('Offline storage not implemented');
    },
    incrementRetryCount: async (_messageId?: string) => {
      console.warn('Offline storage not implemented');
    },
  };
}
