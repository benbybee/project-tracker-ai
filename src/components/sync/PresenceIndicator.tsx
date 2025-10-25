'use client';

import { useRealtime } from '@/app/providers';

interface PresenceIndicatorProps {
  projectId?: string;
  taskId?: string;
  className?: string;
}

export function PresenceIndicator({
  projectId,
  taskId,
  className = '',
}: PresenceIndicatorProps) {
  const { onlineUsers, isConnected } = useRealtime();

  if (!isConnected || onlineUsers.length === 0) {
    return null;
  }

  // Filter users by current context
  const relevantUsers = onlineUsers.filter(
    (user) =>
      (!projectId || user.currentProject === projectId) &&
      (!taskId || user.currentTask === taskId)
  );

  if (relevantUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex -space-x-2">
        {relevantUsers.slice(0, 3).map((user, index) => (
          <div
            key={user.userId}
            className="relative"
            style={{ zIndex: relevantUsers.length - index }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium border-2 border-white">
              {user.userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        ))}
        {relevantUsers.length > 3 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
            +{relevantUsers.length - 3}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600">
        {relevantUsers.length}{' '}
        {relevantUsers.length === 1 ? 'person' : 'people'} online
      </span>
    </div>
  );
}
