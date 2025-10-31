'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useRealtime } from '@/app/providers';
import { getDB } from '@/lib/db.client';
import { useNotifications } from './useNotifications';
import { useActivityFeed } from './useActivityFeed';

interface OfflineMessage {
  id: string;
  threadId: string;
  content: string;
  messageType: string;
  metadata?: Record<string, unknown>;
}

export function useChat(threadId: string) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMessages, setOfflineMessages] = useState<OfflineMessage[]>([]);
  const { onChatMessage, broadcastChatMessage } = useRealtime();
  const { createNotification } = useNotifications();
  const { logActivity } = useActivityFeed();

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: async (message) => {
      broadcastChatMessage(message);

      // Log activity
      await logActivity({
        targetType: 'comment',
        targetId: message.id,
        action: 'commented',
        payload: { content: message.content, threadId },
      });

      // Create notification for mentions
      if (
        message.messageType === 'mention' &&
        (message.metadata as any)?.mentions
      ) {
        for (const mention of (message.metadata as any).mentions) {
          await createNotification({
            userId: mention, // In a real app, resolve username to userId
            type: 'mention',
            title: 'You were mentioned in chat',
            message: `You were mentioned in a chat message`,
            link: `/chat?thread=${threadId}`,
          });
        }
      }
    },
    onError: async (error, variables) => {
      // Store message offline if send fails
      if (!isOnline) {
        const db = await getDB();
        await db.storeOfflineMessage({
          threadId: variables.threadId,
          content: variables.content,
          messageType: variables.messageType,
          metadata: variables.metadata,
        });
      }
    },
  });

  const addReactionMutation = trpc.chat.addReaction.useMutation();
  const markThreadReadMutation = trpc.chat.markThreadRead.useMutation();

  const loadOfflineMessages = useCallback(async () => {
    try {
      const db = await getDB();
      const messages = await db.getOfflineMessages();
      const threadMessages = messages.filter(
        (msg: OfflineMessage) => msg.threadId === threadId
      );
      setOfflineMessages(threadMessages);
    } catch (error) {
      console.error('Failed to load offline messages:', error);
    }
  }, [threadId]);

  const syncOfflineMessages = useCallback(async () => {
    try {
      const db = await getDB();
      const messages = await db.getOfflineMessages();

      for (const message of messages) {
        try {
          await sendMessageMutation.mutateAsync({
            threadId: message.threadId,
            content: message.content,
            messageType: message.messageType,
            metadata: message.metadata,
          });

          // Remove from offline storage on success
          await db.removeOfflineMessage(message.id);
        } catch (error) {
          console.error('Failed to sync offline message:', error);
          // Increment retry count
          await db.incrementRetryCount(message.id);
        }
      }

      // Reload offline messages
      await loadOfflineMessages();
    } catch (error) {
      console.error('Failed to sync offline messages:', error);
    }
  }, [sendMessageMutation, loadOfflineMessages]);

  // Listen for real-time messages
  useEffect(() => {
    const unsubscribe = onChatMessage((message: any) => {
      if (message.threadId === threadId) {
        // Handle incoming message (silently)
      }
    });

    return unsubscribe;
  }, [threadId, onChatMessage]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineMessages();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineMessages]);

  // Load offline messages on mount
  useEffect(() => {
    loadOfflineMessages();
  }, [loadOfflineMessages]);

  const sendMessage = async (
    content: string,
    messageType?: string,
    metadata?: any
  ) => {
    if (isOnline) {
      await sendMessageMutation.mutateAsync({
        threadId,
        content,
        messageType: (messageType || 'text') as
          | 'mention'
          | 'system'
          | 'text'
          | 'reaction',
        metadata,
      });
    } else {
      // Store offline
      const db = await getDB();
      await db.storeOfflineMessage({
        threadId,
        content,
        messageType: (messageType || 'text') as
          | 'mention'
          | 'system'
          | 'text'
          | 'reaction',
        metadata,
      });
      await loadOfflineMessages();
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (isOnline) {
      await addReactionMutation.mutateAsync({
        messageId,
        emoji,
      });
    }
  };

  const markAsRead = async () => {
    if (isOnline) {
      await markThreadReadMutation.mutateAsync({ threadId });
    }
  };

  return {
    sendMessage,
    addReaction,
    markAsRead,
    isOnline,
    offlineMessages,
    isLoading: sendMessageMutation.isPending || addReactionMutation.isPending,
  };
}
