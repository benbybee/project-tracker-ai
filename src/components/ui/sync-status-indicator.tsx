'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSync } from '@/hooks/useSync.client';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({
  className = '',
  showDetails = false,
}: SyncStatusIndicatorProps) {
  const { isOnline, syncStatus, isSyncing, syncProgress } = useSync();
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        text: 'Offline',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        description: 'Working offline - changes will sync when online',
      };
    }

    if (isSyncing) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        text: 'Syncing...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        description: syncProgress
          ? `Syncing ${syncProgress.completed}/${syncProgress.total} items`
          : 'Syncing your changes...',
      };
    }

    if (syncStatus?.failedCount && syncStatus.failedCount > 0) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: `${syncStatus.failedCount} failed`,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        description: 'Some changes failed to sync - check your connection',
      };
    }

    if (syncStatus?.pendingCount && syncStatus.pendingCount > 0) {
      return {
        icon: <Clock className="h-4 w-4" />,
        text: `${syncStatus.pendingCount} pending`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        description: 'Changes waiting to sync',
      };
    }

    if (syncStatus?.lastSyncAt) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Synced',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        description: 'All changes synced successfully',
      };
    }

    return {
      icon: <Wifi className="h-4 w-4" />,
      text: 'Online',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      description: 'Connected and ready',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} cursor-pointer`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {statusInfo.icon}
        <span>{statusInfo.text}</span>
      </div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {statusInfo.icon}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {statusInfo.text}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {statusInfo.description}
            </p>

            {syncProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>
                    {syncProgress.completed}/{syncProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(syncProgress.completed / syncProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {syncStatus && (
              <div className="text-xs text-gray-500 space-y-1">
                {syncStatus.pendingCount > 0 && (
                  <div>Pending: {syncStatus.pendingCount}</div>
                )}
                {syncStatus.failedCount > 0 && (
                  <div>Failed: {syncStatus.failedCount}</div>
                )}
                {syncStatus.lastSyncAt && (
                  <div>
                    Last sync:{' '}
                    {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full right-0 mt-2 w-48 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-2 z-50"
        >
          {statusInfo.description}
        </motion.div>
      )}
    </div>
  );
}

// Compact version for topbar
export function CompactSyncStatus() {
  const { isOnline, syncStatus, isSyncing } = useSync();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
        <WifiOff className="h-3 w-3" />
        <span>Offline</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-xs">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Syncing</span>
      </div>
    );
  }

  if (syncStatus?.pendingCount && syncStatus.pendingCount > 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 rounded-full text-xs">
        <Clock className="h-3 w-3" />
        <span>{syncStatus.pendingCount}</span>
      </div>
    );
  }

  return null;
}
