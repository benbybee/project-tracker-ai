'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
}

interface AiChatHistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
  className?: string;
}

function formatSessionDate(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
}

export function AiChatHistorySidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isLoading = false,
  className = '',
}: AiChatHistorySidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    setDeletingId(sessionId);
    try {
      await onDeleteSession(sessionId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700',
        className
      )}
    >
      {/* Header with New Chat button */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={onNewChat}
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
            'text-white font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-md hover:shadow-lg'
          )}
        >
          <Plus className="h-5 w-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No chat history yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  'w-full group flex items-start gap-2 p-3 rounded-lg mb-2 text-left transition-all duration-200',
                  'hover:bg-slate-100 dark:hover:bg-slate-800',
                  'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                  activeSessionId === session.id &&
                    'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-300/30 dark:border-purple-600/30'
                )}
              >
                <MessageSquare
                  className={cn(
                    'h-4 w-4 mt-0.5 flex-shrink-0',
                    activeSessionId === session.id
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      activeSessionId === session.id
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {session.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatSessionDate(new Date(session.lastMessageAt))}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  disabled={deletingId === session.id}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200',
                    'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400',
                    'focus:outline-none focus:ring-2 focus:ring-red-500/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    activeSessionId === session.id && 'opacity-100'
                  )}
                  aria-label="Delete chat"
                >
                  {deletingId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Chats auto-delete after 48 hours
        </p>
      </div>
    </div>
  );
}
