'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
// @ts-ignore
import superjson from 'superjson';
import { getWebSocketClient } from '@/lib/ws-client';

// Real-time context
interface RealtimeContextType {
  isConnected: boolean;
  status:
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'error';
  onlineUsers: any[];
  updatePresence: (data: any) => void;
  startTyping: (entityType: string, entityId: string) => void;
  stopTyping: (entityType: string, entityId: string) => void;
  broadcastUpdate: (entityType: string, entityId: string, data: any) => void;
  // Notification and activity events
  onNotification: (callback: (notification: any) => void) => () => void;
  onActivity: (callback: (activity: any) => void) => () => void;
  broadcastNotification: (notification: any) => void;
  broadcastActivity: (activity: any) => void;
  // Chat events
  onChatMessage: (callback: (message: any) => void) => () => void;
  onChatTyping: (callback: (typing: any) => void) => () => void;
  onChatThread: (callback: (thread: any) => void) => () => void;
  broadcastChatMessage: (message: any) => void;
  broadcastChatTyping: (threadId: string, isTyping: boolean) => void;
  broadcastChatThread: (thread: any) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    console.warn(
      '[useRealtime] Called outside of RealtimeProvider, returning fallback'
    );
    // Return a fallback object instead of throwing
    return {
      isConnected: false,
      status: 'disconnected' as const,
      onlineUsers: [],
      updatePresence: () => {},
      startTyping: () => {},
      stopTyping: () => {},
      broadcastUpdate: () => {},
      onNotification: () => () => {},
      onActivity: () => () => {},
      broadcastNotification: () => {},
      broadcastActivity: () => {},
      onChatMessage: () => () => {},
      onChatTyping: () => () => {},
      onChatThread: () => () => {},
      broadcastChatMessage: () => {},
      broadcastChatTyping: () => {},
      broadcastChatThread: () => {},
    };
  }
  return context;
}

function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  >('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [wsClient, setWsClient] = useState<any>(null);
  const [notificationListeners, setNotificationListeners] = useState<
    Set<(notification: any) => void>
  >(new Set());
  const [activityListeners, setActivityListeners] = useState<
    Set<(activity: any) => void>
  >(new Set());
  const [chatMessageListeners, setChatMessageListeners] = useState<
    Set<(message: any) => void>
  >(new Set());
  const [chatTypingListeners, setChatTypingListeners] = useState<
    Set<(typing: any) => void>
  >(new Set());
  const [chatThreadListeners, setChatThreadListeners] = useState<
    Set<(thread: any) => void>
  >(new Set());

  useEffect(() => {
    try {
      // Initialize WebSocket client
      const client = getWebSocketClient();
      setWsClient(client);

      const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus as any);
        setIsConnected(newStatus === 'connected');
      };

      const handleMessage = (event: any) => {
        try {
          if (event.type === 'user_presence') {
            // Update online users list
            setOnlineUsers((prev) => {
              const existing = prev.find((u) => u.userId === event.userId);
              if (existing) {
                return prev.map((u) =>
                  u.userId === event.userId ? { ...u, ...event.data } : u
                );
              } else {
                return [...prev, event.data];
              }
            });
          } else if (event.type === 'notification') {
            // Broadcast notification to listeners
            notificationListeners.forEach((callback) => callback(event.data));
          } else if (event.type === 'activity') {
            // Broadcast activity to listeners
            activityListeners.forEach((callback) => callback(event.data));
          } else if (event.type === 'chat_message') {
            // Broadcast chat message to listeners
            chatMessageListeners.forEach((callback) => callback(event.data));
          } else if (event.type === 'chat_typing') {
            // Broadcast chat typing to listeners
            chatTypingListeners.forEach((callback) => callback(event.data));
          } else if (event.type === 'chat_thread') {
            // Broadcast chat thread to listeners
            chatThreadListeners.forEach((callback) => callback(event.data));
          }
        } catch (error) {
          console.warn(
            '[RealtimeProvider] Error handling message (non-critical):',
            error
          );
        }
      };

      const unsubscribeStatus = client.on('status', handleStatusChange);
      const unsubscribeMessage = client.on('message', handleMessage);

      // Connect if not already connected (but don't block on failure)
      if (!client.isConnected()) {
        try {
          client.connect();
        } catch (error) {
          console.warn(
            '[RealtimeProvider] WebSocket connection failed (non-critical):',
            error
          );
        }
      }

      return () => {
        try {
          unsubscribeStatus();
          unsubscribeMessage();
        } catch (error) {
          console.warn(
            '[RealtimeProvider] Cleanup error (non-critical):',
            error
          );
        }
      };
    } catch (error) {
      console.warn(
        '[RealtimeProvider] Initialization failed (non-critical):',
        error
      );
      // Don't throw - allow the app to continue even if WebSocket fails
    }
  }, [
    notificationListeners,
    activityListeners,
    chatMessageListeners,
    chatTypingListeners,
    chatThreadListeners,
  ]);

  const updatePresence = (data: any) => {
    if (wsClient) {
      wsClient.updatePresence(data);
    }
  };

  const startTyping = (entityType: string, entityId: string) => {
    if (wsClient) {
      wsClient.startTyping(entityType as 'task' | 'project', entityId);
    }
  };

  const stopTyping = (entityType: string, entityId: string) => {
    if (wsClient) {
      wsClient.stopTyping(entityType as 'task' | 'project', entityId);
    }
  };

  const broadcastUpdate = (entityType: string, entityId: string, data: any) => {
    if (wsClient) {
      wsClient.broadcastUpdate(
        entityType as 'task' | 'project',
        entityId,
        data
      );
    }
  };

  const onNotification = useCallback(
    (callback: (notification: any) => void) => {
      setNotificationListeners((prev) => new Set([...prev, callback]));
      return () => {
        setNotificationListeners((prev) => {
          const newSet = new Set(prev);
          newSet.delete(callback);
          return newSet;
        });
      };
    },
    []
  );

  const onActivity = useCallback((callback: (activity: any) => void) => {
    setActivityListeners((prev) => new Set([...prev, callback]));
    return () => {
      setActivityListeners((prev) => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  const broadcastNotification = (notification: any) => {
    if (wsClient) {
      wsClient.send({
        type: 'notification',
        data: notification,
        timestamp: Date.now(),
      });
    }
  };

  const broadcastActivity = (activity: any) => {
    if (wsClient) {
      wsClient.send({
        type: 'activity',
        data: activity,
        timestamp: Date.now(),
      });
    }
  };

  const onChatMessage = useCallback((callback: (message: any) => void) => {
    setChatMessageListeners((prev) => new Set([...prev, callback]));
    return () => {
      setChatMessageListeners((prev) => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  const onChatTyping = useCallback((callback: (typing: any) => void) => {
    setChatTypingListeners((prev) => new Set([...prev, callback]));
    return () => {
      setChatTypingListeners((prev) => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  const onChatThread = useCallback((callback: (thread: any) => void) => {
    setChatThreadListeners((prev) => new Set([...prev, callback]));
    return () => {
      setChatThreadListeners((prev) => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  const broadcastChatMessage = (message: any) => {
    if (wsClient) {
      wsClient.send({
        type: 'chat_message',
        data: message,
        timestamp: Date.now(),
      });
    }
  };

  const broadcastChatTyping = (threadId: string, isTyping: boolean) => {
    if (wsClient) {
      wsClient.send({
        type: 'chat_typing',
        data: { threadId, isTyping },
        timestamp: Date.now(),
      });
    }
  };

  const broadcastChatThread = (thread: any) => {
    if (wsClient) {
      wsClient.send({
        type: 'chat_thread',
        data: thread,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        status,
        onlineUsers,
        updatePresence,
        startTyping,
        stopTyping,
        broadcastUpdate,
        onNotification,
        onActivity,
        broadcastNotification,
        broadcastActivity,
        onChatMessage,
        onChatTyping,
        onChatThread,
        broadcastChatMessage,
        broadcastChatTyping,
        broadcastChatThread,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 30 seconds - balanced approach
            staleTime: 30 * 1000,
            // Cache data for 10 minutes for offline resilience
            cacheTime: 10 * 60 * 1000,
            // Retry once on failure
            retry: 1,
            // Refetch on window focus to ensure fresh data
            refetchOnWindowFocus: 'always',
            // Refetch on mount to ensure fresh data
            refetchOnMount: 'always',
            // Don't refetch on reconnect to avoid unnecessary requests
            refetchOnReconnect: false,
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <RealtimeProvider>{children}</RealtimeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
