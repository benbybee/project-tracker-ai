'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  metadata?: any;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick: (id: string) => void;
  onClose: () => void;
}

export function NotificationDropdown({ 
  notifications, 
  onNotificationClick, 
  onClose 
}: NotificationDropdownProps) {
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      setIsMarkingAll(false);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_updated':
      case 'task_completed':
        return '📋';
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

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          {notifications.some(n => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="text-xs"
            >
              {isMarkingAll ? (
                <Check className="h-3 w-3" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-lg">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      !notification.read ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <time className="text-xs text-gray-500">
                      {getTimeAgo(notification.createdAt)}
                    </time>
                    {notification.link && (
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              window.location.href = '/activity';
              onClose();
            }}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
}
