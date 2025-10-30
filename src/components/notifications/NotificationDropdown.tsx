'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, ExternalLink, X, CheckCircle, Clock, Eye, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface NotificationAction {
  type: 'complete' | 'snooze' | 'view';
  label: string;
  taskId?: string;
  snoozeDays?: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  metadata?: any;
  actions?: NotificationAction[];
  groupKey?: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick: (id: string) => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  onNotificationClick,
  onClose,
}: NotificationDropdownProps) {
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      setIsMarkingAll(false);
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
  });

  const executeActionMutation = trpc.notifications.executeAction.useMutation({
    onSuccess: () => {
      setProcessingAction(null);
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      utils.tasks.list.invalidate();
      toast.success('Action completed successfully');
    },
    onError: (error) => {
      setProcessingAction(null);
      toast.error('Failed to execute action: ' + error.message);
    },
  });

  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      toast.success('Notification deleted');
    },
  });

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    await markAllAsReadMutation.mutateAsync();
  };

  const handleNotificationClick = async (notification: Notification) => {
    await onNotificationClick(notification.id);

    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const handleAction = async (
    e: React.MouseEvent,
    notification: Notification,
    action: NotificationAction
  ) => {
    e.stopPropagation();
    setProcessingAction(notification.id);

    await executeActionMutation.mutateAsync({
      notificationId: notification.id,
      actionType: action.type,
      taskId: action.taskId,
      snoozeDays: action.snoozeDays,
    });
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotificationMutation.mutateAsync({ id: notificationId });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_updated':
      case 'task_completed':
      case 'task_reminder':
        return '📋';
      case 'due_date_approaching':
        return '⏰';
      case 'project_updated':
        return '📁';
      case 'comment_added':
        return '💬';
      case 'mention':
        return '👤';
      case 'sync_conflict':
        return '⚠️';
      case 'collaboration':
        return '🤝';
      case 'ai_suggestion':
        return '🤖';
      default:
        return '🔔';
    }
  };

  const getTimeAgo = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'complete':
        return CheckCircle;
      case 'snooze':
        return Clock;
      case 'view':
        return Eye;
      default:
        return Eye;
    }
  };

  // Group notifications
  const groupedNotifications = new Map<string, Notification[]>();
  const ungroupedNotifications: Notification[] = [];

  notifications.forEach((notif) => {
    if (notif.groupKey) {
      if (!groupedNotifications.has(notif.groupKey)) {
        groupedNotifications.set(notif.groupKey, []);
      }
      groupedNotifications.get(notif.groupKey)!.push(notif);
    } else {
      ungroupedNotifications.push(notif);
    }
  });

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          {notifications.some((n) => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="text-xs hover:bg-white/50"
            >
              {isMarkingAll ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 hover:bg-white/50">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-[28rem] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <>
            {/* Grouped notifications */}
            {Array.from(groupedNotifications.entries()).map(([groupKey, items]) => (
              <div key={groupKey} className="border-b border-gray-100">
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getNotificationIcon(items[0].type)}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {items.length} {items[0].type.replace('_', ' ')} notifications
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => items.forEach(item => handleDelete({} as any, item.id))}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Individual notifications */}
            {ungroupedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`group p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p
                            className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center space-x-2 mt-2">
                          <time className="text-xs text-gray-500">
                            {getTimeAgo(notification.createdAt)}
                          </time>
                          {notification.link && (
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>View</span>
                            </button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex items-center space-x-2 mt-3">
                            {notification.actions.map((action, idx) => {
                              const Icon = getActionIcon(action.type);
                              return (
                                <Button
                                  key={idx}
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleAction(e, notification, action)}
                                  disabled={processingAction === notification.id}
                                  className="h-7 text-xs"
                                >
                                  <Icon className="h-3 w-3 mr-1" />
                                  {action.label}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"
                      >
                        <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs hover:bg-white"
            onClick={() => {
              window.location.href = '/activity';
              onClose();
            }}
          >
            View all activity
          </Button>
        </div>
      )}
    </div>
  );
}
