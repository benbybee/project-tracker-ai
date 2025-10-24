'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThreadList } from './ThreadList';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { trpc } from '@/lib/trpc';
import { useRealtime } from '@/app/providers';

interface ChatPanelProps {
  projectId: string;
  className?: string;
}

export function ChatPanel({ projectId, className = '' }: ChatPanelProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadDescription, setNewThreadDescription] = useState('');
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { onChatMessage, onChatTyping, broadcastChatMessage } = useRealtime();

  // Fetch threads
  const { data: threads, refetch: refetchThreads } = trpc.chat.getThreads.useQuery({
    projectId,
    limit: 20,
  });

  // Fetch messages for selected thread
  const { data: messages, refetch: refetchMessages } = trpc.chat.getThreadMessages.useQuery(
    {
      threadId: selectedThreadId!,
      limit: 50,
    },
    {
      enabled: !!selectedThreadId,
    }
  );

  // Mutations
  const createThreadMutation = trpc.chat.createThread.useMutation({
    onSuccess: () => {
      setShowNewThreadForm(false);
      setNewThreadTitle('');
      setNewThreadDescription('');
      refetchThreads();
    },
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (message) => {
      broadcastChatMessage(message);
      refetchMessages();
    },
  });

  const addReactionMutation = trpc.chat.addReaction.useMutation({
    onSuccess: () => {
      refetchMessages();
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for real-time chat events
  useEffect(() => {
    const unsubscribeMessage = onChatMessage((message) => {
      if (message.threadId === selectedThreadId) {
        refetchMessages();
      }
    });

    const unsubscribeTyping = onChatTyping((typing) => {
      if (typing.threadId === selectedThreadId) {
        // In a real app, you'd manage typing users properly
        if (typing.isTyping) {
          setTypingUsers(prev => [...prev, { id: 'user1', name: 'Someone' }]);
        } else {
          setTypingUsers(prev => prev.slice(0, -1));
        }
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [selectedThreadId, onChatMessage, onChatTyping, refetchMessages]);

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleSendMessage = (content: string, messageType?: string, metadata?: any) => {
    if (selectedThreadId) {
      sendMessageMutation.mutate({
        threadId: selectedThreadId,
        content,
        messageType: (messageType || 'text') as 'mention' | 'system' | 'text' | 'reaction',
        metadata,
      });
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReactionMutation.mutate({
      messageId,
      emoji,
    });
  };

  const handleCreateThread = () => {
    if (newThreadTitle.trim()) {
      createThreadMutation.mutate({
        projectId,
        title: newThreadTitle,
        description: newThreadDescription,
      });
    }
  };

  const filteredThreads = threads?.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className={`flex h-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Threads Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewThreadForm(!showNewThreadForm)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* New Thread Form */}
        <AnimatePresence>
          {showNewThreadForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 border-b border-gray-200 bg-gray-50"
            >
              <div className="space-y-3">
                <Input
                  placeholder="Thread title"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newThreadDescription}
                  onChange={(e) => setNewThreadDescription(e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateThread}
                    disabled={!newThreadTitle.trim() || createThreadMutation.isPending}
                    size="sm"
                    className="flex-1"
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewThreadForm(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-4">
          <ThreadList
            threads={filteredThreads as any}
            onThreadSelect={handleThreadSelect}
            selectedThreadId={selectedThreadId || undefined}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedThreadId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages?.map((message, index) => {
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const showAvatar = !prevMessage || prevMessage.userId !== message.userId;
                  const showTimestamp = !prevMessage || 
                    (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 300000; // 5 minutes

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message as any}
                      isOwn={message.userId === 'current-user-id'} // In a real app, get from session
                      showAvatar={showAvatar}
                      showTimestamp={showTimestamp}
                      onReaction={handleReaction}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Typing Indicator */}
              <TypingIndicator users={typingUsers} />

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput
              threadId={selectedThreadId}
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No thread selected</h3>
              <p className="text-gray-500">Choose a thread from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
