'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useSync, useEntitySyncStatus } from '@/hooks/useSync.client';

interface OfflineToastProps {
  onDismiss?: () => void;
}

export function OfflineToast({ onDismiss }: OfflineToastProps) {
  const { isOnline, syncStatus, isSyncing } = useSync();
  const [showToast, setShowToast] = useState(false);
  const [lastOnlineStatus, setLastOnlineStatus] = useState(isOnline);

  useEffect(() => {
    // Show toast when status changes
    if (isOnline !== lastOnlineStatus) {
      setShowToast(true);
      setLastOnlineStatus(isOnline);
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  }, [isOnline, lastOnlineStatus]);

  useEffect(() => {
    // Show toast when sync completes
    if (syncStatus?.lastSyncAt && !isSyncing) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  }, [syncStatus?.lastSyncAt, isSyncing]);

  const getToastContent = () => {
    if (isSyncing) {
      return {
        icon: <RefreshCw className="h-5 w-5 animate-spin" />,
        title: 'Syncing changes...',
        message: `${syncStatus?.pendingCount || 0} items pending`,
        type: 'info' as const,
      };
    }

    if (!isOnline) {
      return {
        icon: <WifiOff className="h-5 w-5" />,
        title: 'Offline mode enabled',
        message: 'Changes will sync when you\'re back online',
        type: 'warning' as const,
      };
    }

    if (syncStatus?.lastSyncAt && !isSyncing) {
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        title: 'All changes synced successfully!',
        message: 'Your data is up to date',
        type: 'success' as const,
      };
    }

    if (syncStatus?.failedCount && syncStatus.failedCount > 0) {
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        title: 'Some changes failed to sync',
        message: `${syncStatus.failedCount} items need attention`,
        type: 'error' as const,
      };
    }

    return null;
  };

  const content = getToastContent();

  if (!content || !showToast) {
    return null;
  }

  const getToastStyles = () => {
    switch (content.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 ${getToastStyles()}`}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {content.icon}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {content.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {content.message}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => {
                setShowToast(false);
                onDismiss?.();
              }}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="Close notification"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Component for showing sync status in the topbar
export function SyncStatusIndicator() {
  const { isOnline, syncStatus, isSyncing } = useSync();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
        <WifiOff className="h-3 w-3" />
        Offline
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Syncing...
      </div>
    );
  }

  if (syncStatus?.pendingCount && syncStatus.pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-full text-xs font-medium">
        <Clock className="h-3 w-3" />
        {syncStatus.pendingCount} pending
      </div>
    );
  }

  return null;
}

// Component for showing sync status on individual items
export function EntitySyncStatus({ 
  entityType, 
  entityId 
}: { 
  entityType: 'task' | 'project' | 'role';
  entityId: string;
}) {
  const syncStatus = useEntitySyncStatus(entityType, entityId);

  if (syncStatus === 'synced') {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      {syncStatus === 'pending' && (
        <Clock className="h-3 w-3 text-yellow-500" />
      )}
      {syncStatus === 'failed' && (
        <AlertCircle className="h-3 w-3 text-red-500" />
      )}
    </div>
  );
}
