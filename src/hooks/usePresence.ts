'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type PresenceData = {
  userId: string;
  userName: string;
  userEmail: string;
  isOnline: boolean;
  lastActiveAt: number;
  currentProject?: string;
  currentTask?: string;
  isEditing?: boolean;
};

export function usePresence() {
  const { data: session } = useSession();
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    // Simulate presence tracking
    setIsOnline(true);

    // Mock online users for demonstration
    setOnlineUsers([
      {
        userId: session.user.id || '1',
        userName: session.user.name || 'Current User',
        userEmail: session.user.email || 'user@example.com',
        isOnline: true,
        lastActiveAt: Date.now(),
        currentProject: undefined,
        currentTask: undefined,
        isEditing: false,
      },
    ]);

    // Cleanup on unmount
    return () => {
      setIsOnline(false);
    };
  }, [session]);

  const updatePresence = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_data: Partial<PresenceData>) => {
      if (!session?.user) return;

      // In a real implementation, this would send presence data to the WebSocket
    },
    [session]
  );

  const startTyping = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_entityType: 'task' | 'project', _entityId: string) => {
      if (!session?.user) return;

      // In a real implementation, this would send typing indicator to the WebSocket
    },
    [session]
  );

  const stopTyping = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_entityType: 'task' | 'project', _entityId: string) => {
      if (!session?.user) return;

      // In a real implementation, this would clear typing indicator via the WebSocket
    },
    [session]
  );

  return {
    onlineUsers,
    isOnline,
    updatePresence,
    startTyping,
    stopTyping,
  };
}
