'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useRealtime } from '@/app/providers';
import { notificationManager } from '@/lib/notification-manager';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { onNotification, broadcastNotification } = useRealtime();

  const { data: notificationsData, refetch: refetchNotifications } =
    trpc.notifications.getNotifications.useQuery({
      limit: 20,
      unreadOnly: false,
      grouped: false,
    });

  const { data: unreadCountData, refetch: refetchUnreadCount } =
    trpc.notifications.getUnreadCount.useQuery();

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
    },
  });

  const createNotificationMutation =
    trpc.notifications.createNotification.useMutation({
      onSuccess: (notification) => {
        // Broadcast the notification to other clients
        broadcastNotification(notification);
        refetchNotifications();
        refetchUnreadCount();
      },
    });

  // Update local state when data changes
  useEffect(() => {
    if (notificationsData) {
      setNotifications(
        Array.isArray(notificationsData) ? notificationsData : []
      );
    }
  }, [notificationsData]);

  useEffect(() => {
    if (unreadCountData !== undefined) {
      setUnreadCount(unreadCountData);
    }
  }, [unreadCountData]);

  // Listen for real-time notifications
  useEffect(() => {
    const unsubscribe = onNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }

      // Show toast notification for new notifications
      if (!notification.read) {
        notificationManager.addNotification(notification);
      }
    });

    return unsubscribe;
  }, [onNotification]);

  const markAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync({ id });
  };

  const markAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const createNotification = async (notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) => {
    return await createNotificationMutation.mutateAsync({
      ...notification,
      type: notification.type as
        | 'task_assigned'
        | 'task_updated'
        | 'task_completed'
        | 'project_updated'
        | 'comment_added'
        | 'mention'
        | 'sync_conflict'
        | 'collaboration',
    });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetchNotifications,
    refetchUnreadCount,
    isLoading: markAsReadMutation.isPending || markAllAsReadMutation.isPending,
  };
}
