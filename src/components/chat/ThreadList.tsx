'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThreadListProps {
  threads: Array<{
    id: string;
    title: string;
    description?: string;
    messageCount: number;
    lastMessageAt?: Date;
    participants: Array<{
      id: string;
      name: string;
    }>;
    isActive?: boolean;
  }>;
  onThreadSelect: (threadId: string) => void;
  selectedThreadId?: string;
  className?: string;
}

export function ThreadList({
  threads,
  onThreadSelect,
  selectedThreadId,
  className = ''
}: ThreadListProps) {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const toggleExpanded = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const getTimeAgo = (date?: Date) => {
    if (!date) return 'No messages';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getLastMessagePreview = (thread: any) => {
    if (thread.messageCount === 0) {
      return 'No messages yet';
    }
    return `${thread.messageCount} message${thread.messageCount === 1 ? '' : 's'}`;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {threads.map((thread) => {
        const isExpanded = expandedThreads.has(thread.id);
        const isSelected = selectedThreadId === thread.id;
        const hasUnread = thread.messageCount > 0; // In a real app, you'd check unread status

        return (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`border rounded-lg transition-colors ${
              isSelected
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            {/* Thread Header */}
            <div
              className="p-3 cursor-pointer"
              onClick={() => onThreadSelect(thread.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-gray-500" />
                  <h3 className="font-medium text-sm text-gray-900 truncate">
                    {thread.title}
                  </h3>
                  {hasUnread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(thread.lastMessageAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(thread.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Thread Description */}
              {thread.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {thread.description}
                </p>
              )}

              {/* Thread Stats */}
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{thread.participants.length} participant{thread.participants.length === 1 ? '' : 's'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{getLastMessagePreview(thread)}</span>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200 bg-gray-50"
              >
                <div className="p-3">
                  {/* Participants */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Participants</h4>
                    <div className="flex flex-wrap gap-2">
                      {thread.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center space-x-2 px-2 py-1 bg-white rounded-full border border-gray-200"
                        >
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-700">
                            {participant.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thread Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onThreadSelect(thread.id)}
                      className="text-xs"
                    >
                      Open Thread
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      Settings
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {/* Empty State */}
      {threads.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No threads yet</p>
          <p className="text-xs">Start a conversation to see threads here</p>
        </div>
      )}
    </div>
  );
}
