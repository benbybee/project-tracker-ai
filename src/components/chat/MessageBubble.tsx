'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MoreHorizontal, Smile, Reply, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    messageType: 'text' | 'system' | 'mention' | 'reaction';
    metadata?: any;
    replyToId?: string;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
    };
    reactions?: Array<{
      id: string;
      emoji: string;
      userId: string;
      user: {
        name: string;
      };
    }>;
  };
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  onReaction,
  onReply,
  onEdit,
  onDelete
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getEditedTime = () => {
    if (!message.isEdited || !message.editedAt) return null;
    try {
      return formatDistanceToNow(new Date(message.editedAt), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getReactionCount = (emoji: string) => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const getReactionUsers = (emoji: string) => {
    return message.reactions?.filter(r => r.emoji === emoji).map(r => r.user.name) || [];
  };

  const handleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji);
    setShowReactions(false);
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start space-x-2 group ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {message.user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 max-w-xs lg:max-w-md ${isOwn ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble */}
        <div
          className={`inline-block px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          } ${message.messageType === 'system' ? 'bg-yellow-100 text-yellow-800' : ''}`}
        >
          {/* Reply indicator */}
          {message.replyToId && (
            <div className="text-xs opacity-70 mb-1 border-l-2 border-current pl-2">
              Replying to message
            </div>
          )}

          {/* Message content */}
          {message.messageType === 'text' || message.messageType === 'mention' ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span>{children}</span>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-black/10 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
              }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="text-sm">{message.content}</span>
          )}

          {/* Edited indicator */}
          {message.isEdited && (
            <div className="text-xs opacity-70 mt-1">
              (edited {getEditedTime()})
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                title={getReactionUsers(emoji).join(', ')}
              >
                <span>{emoji}</span>
                <span>{getReactionCount(emoji)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {getTimeAgo()}
          </div>
        )}
      </div>

      {/* Action Menu */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-1"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReactions(!showReactions)}
            className="h-8 w-8 p-0"
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply?.(message.id)}
            className="h-8 w-8 p-0"
          >
            <Reply className="h-4 w-4" />
          </Button>

          {isOwn && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(message.id)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(message.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </motion.div>
      )}

      {/* Reaction Picker */}
      {showReactions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1 z-10"
        >
          {commonEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="hover:bg-gray-100 rounded p-1 text-lg"
            >
              {emoji}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
