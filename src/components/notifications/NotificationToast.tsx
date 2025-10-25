'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

interface NotificationToastProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  };
  onClose: (id: string) => void;
  duration?: number;
}

export function NotificationToast({
  notification,
  onClose,
  duration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.id, onClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'sync_conflict':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'mention':
        return <Bell className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'task_completed':
        return 'bg-green-50 border-green-200';
      case 'sync_conflict':
        return 'bg-red-50 border-red-200';
      case 'mention':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed bottom-4 right-4 w-80 p-4 rounded-lg shadow-lg border ${getBackgroundColor()} z-50`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">{getIcon()}</div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notification.link && (
            <div className="mt-3">
              <button
                onClick={() => {
                  window.location.href = notification.link!;
                  handleClose();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View details
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
