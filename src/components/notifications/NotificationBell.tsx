'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const {
    data: unreadCount,
    refetch,
    error: unreadError,
  } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.warn(
        '[NotificationBell] Failed to fetch unread count (non-critical):',
        error.message
      );
    },
  });

  const { data: notifications, error: notificationsError } =
    trpc.notifications.getNotifications.useQuery(
      {
        limit: 10,
        unreadOnly: false,
      },
      {
        retry: 1,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
        onError: (error) => {
          console.warn(
            '[NotificationBell] Failed to fetch notifications (non-critical):',
            error.message
          );
        },
      }
    );

  // Check for new notifications
  useEffect(() => {
    if (unreadCount && unreadCount > 0) {
      setHasNewNotifications(true);
    }
  }, [unreadCount]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (hasNewNotifications) {
      setHasNewNotifications(false);
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    // Optimistic update - immediately update UI
    setHasNewNotifications(false);

    // Mark as read
    // TODO: Implement markAsRead mutation
    refetch();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        {hasNewNotifications ? (
          <BellRing className="h-5 w-5 text-blue-600" />
        ) : (
          <Bell className="h-5 w-5" />
        )}

        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={(notifications as any) || []}
          onNotificationClick={handleNotificationClick}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
