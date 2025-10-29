/**
 * Clear Local Storage Utility
 * 
 * This utility helps clear browser-side storage (IndexedDB) when you reset
 * the database. This prevents stale data from appearing in the UI.
 */

/**
 * Clears all IndexedDB databases for this application
 */
export async function clearIndexedDB(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('clearIndexedDB called on server - skipping');
    return;
  }

  try {
    // Clear the main task tracker database
    const dbName = 'tasktracker-v1';
    
    console.log('🗑️ Deleting IndexedDB:', dbName);
    
    // Delete the database
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      
      request.onsuccess = () => {
        console.log('✅ IndexedDB deleted successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to delete IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onblocked = () => {
        console.warn('⚠️ IndexedDB deletion blocked - close all tabs and try again');
        reject(new Error('Database deletion blocked'));
      };
    });
    
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
    throw error;
  }
}

/**
 * Clears localStorage
 */
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') {
    console.warn('clearLocalStorage called on server - skipping');
    return;
  }

  try {
    console.log('🗑️ Clearing localStorage...');
    localStorage.clear();
    console.log('✅ localStorage cleared');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    throw error;
  }
}

/**
 * Clears sessionStorage
 */
export function clearSessionStorage(): void {
  if (typeof window === 'undefined') {
    console.warn('clearSessionStorage called on server - skipping');
    return;
  }

  try {
    console.log('🗑️ Clearing sessionStorage...');
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    throw error;
  }
}

/**
 * Clears all browser storage (IndexedDB, localStorage, sessionStorage)
 */
export async function clearAllBrowserStorage(): Promise<void> {
  console.log('🧹 Clearing all browser storage...\n');
  
  await clearIndexedDB();
  clearLocalStorage();
  clearSessionStorage();
  
  console.log('\n✨ All browser storage cleared!');
  console.log('💡 Refresh the page (Ctrl+Shift+R) to complete the reset.');
}

/**
 * Window-accessible function for manual clearing via browser console
 */
if (typeof window !== 'undefined') {
  (window as any).clearAppStorage = clearAllBrowserStorage;
  console.log('💡 Tip: Run window.clearAppStorage() in console to clear all storage');
}

