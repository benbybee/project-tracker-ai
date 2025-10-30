'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CommentEditor } from './comment-editor';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Pin, PinOff, Smile, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  userId: string;
  content: string;
  isPinned: boolean;
  isEdited: boolean;
  reactions?: Array<{ emoji: string; userId: string }>;
  createdAt: Date;
  editedAt?: Date | null;
}

interface CommentItemProps {
  comment: Comment;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (content: string) => Promise<void>;
  onDelete: () => void;
  onTogglePin: () => void;
  onReaction: (emoji: string) => void;
}

export function CommentItem({
  comment,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onTogglePin,
  onReaction,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isOwner = session?.user?.id === comment.userId;

  const getTimeAgo = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Convert task links (#TASK-123) to clickable links
  const renderContentWithLinks = (content: string) => {
    const taskLinkRegex = /#TASK-(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = taskLinkRegex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add the link
      const taskId = match[1];
      parts.push(
        <a
          key={`link-${match.index}`}
          href={`#`}
          onClick={(e) => {
            e.preventDefault();
            // TODO: Open task modal with taskId
            console.log('Open task:', taskId);
          }}
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          {match[0]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  // Group reactions by emoji
  const groupedReactions = (comment.reactions || []).reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          userIds: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].userIds.push(reaction.userId);
      return acc;
    },
    {} as Record<string, { count: number; userIds: string[] }>
  );

  const commonEmojis = ['👍', '❤️', '😄', '🎉', '🚀', '👀'];

  if (isEditing) {
    return (
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <CommentEditor
          onSubmit={onUpdate}
          onCancel={onCancelEdit}
          initialValue={comment.content}
          submitLabel="Save"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className={`group relative border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
        comment.isPinned
          ? 'border-yellow-300 bg-yellow-50/50'
          : 'border-gray-200'
      }`}
    >
      {/* Pin Indicator */}
      {comment.isPinned && (
        <div className="absolute top-2 right-2 text-yellow-600">
          <Pin className="h-4 w-4 fill-current" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">
              {isOwner ? 'You' : 'User'}
            </span>
            <span className="text-xs text-gray-500">
              {getTimeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePin}>
                {comment.isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="text-gray-700 whitespace-pre-wrap mb-3">
        {renderContentWithLinks(comment.content)}
      </div>

      {/* Reactions & React Button */}
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        {/* Existing Reactions */}
        {Object.entries(groupedReactions).map(([emoji, data]) => {
          const hasReacted = data.userIds.includes(session?.user?.id || '');
          return (
            <button
              key={emoji}
              onClick={() => onReaction(emoji)}
              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${
                hasReacted
                  ? 'bg-blue-100 border-2 border-blue-300'
                  : 'bg-gray-100 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              <span>{emoji}</span>
              <span className="text-xs font-medium">{data.count}</span>
            </button>
          );
        })}

        {/* Add Reaction Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Smile className="h-4 w-4" />
          </Button>

          {/* Simple Reaction Picker */}
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1 z-10">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(emoji);
                    setShowReactionPicker(false);
                  }}
                  className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
