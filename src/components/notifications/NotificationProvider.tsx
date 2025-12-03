'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationToast } from './NotificationToast';
import { useNotifications } from '@/hooks/useNotifications';

interface ToastNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

/**
 * Global notification provider that displays toast notifications
 * for real-time events (task updates, sync conflicts, etc.)
 */
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { notifications, markAsRead } = useNotifications();

  // Listen for new notifications and convert them to toasts
  useEffect(() => {
    // Get unread notifications
    const unreadNotifications = notifications.filter((n) => !n.read);

    // Convert to toasts if they're new
    unreadNotifications.forEach((notification) => {
      // Check if we already have a toast for this notification
      const existingToast = toasts.find((t) => t.id === notification.id);
      if (!existingToast) {
        addToast({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
        });

        // Auto-mark as read after showing toast
        setTimeout(() => {
          markAsRead(notification.id);
        }, 5000);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const addToast = useCallback((toast: ToastNotification) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <NotificationToast
              notification={toast}
              onClose={removeToast}
              duration={5000}
            />
          </div>
        ))}
      </div>
    </>
  );
}
