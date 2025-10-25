'use client';

import { NotificationToast } from '@/components/notifications/NotificationToast';

interface NotificationManager {
  notifications: Map<string, any>;
  listeners: Set<(notifications: any[]) => void>;
}

class NotificationManagerClass {
  private notifications = new Map<string, any>();
  private listeners = new Set<(notifications: any[]) => void>();

  addNotification(notification: any) {
    this.notifications.set(notification.id, {
      ...notification,
      timestamp: Date.now(),
    });

    this.notifyListeners();
  }

  removeNotification(id: string) {
    this.notifications.delete(id);
    this.notifyListeners();
  }

  getNotifications() {
    return Array.from(this.notifications.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  subscribe(listener: (notifications: any[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const notifications = this.getNotifications();
    this.listeners.forEach((listener) => listener(notifications));
  }

  clear() {
    this.notifications.clear();
    this.notifyListeners();
  }
}

export const notificationManager = new NotificationManagerClass();
