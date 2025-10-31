'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { CommentEditor } from './comment-editor';
import { CommentItem } from './comment-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: comments, isLoading } = trpc.comments.getComments.useQuery({
    taskId,
  });

  const createCommentMutation = trpc.comments.createComment.useMutation({
    onSuccess: () => {
      utils.comments.getComments.invalidate({ taskId });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error('Failed to add comment: ' + error.message);
    },
  });

  const updateCommentMutation = trpc.comments.updateComment.useMutation({
    onSuccess: () => {
      utils.comments.getComments.invalidate({ taskId });
      setEditingCommentId(null);
      toast.success('Comment updated');
    },
    onError: (error) => {
      toast.error('Failed to update comment: ' + error.message);
    },
  });

  const deleteCommentMutation = trpc.comments.deleteComment.useMutation({
    onSuccess: () => {
      utils.comments.getComments.invalidate({ taskId });
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete comment: ' + error.message);
    },
  });

  const togglePinMutation = trpc.comments.togglePin.useMutation({
    onSuccess: () => {
      utils.comments.getComments.invalidate({ taskId });
    },
  });

  const addReactionMutation = trpc.comments.addReaction.useMutation({
    onSuccess: () => {
      utils.comments.getComments.invalidate({ taskId });
    },
  });

  const handleCreate = async (content: string) => {
    await createCommentMutation.mutateAsync({
      taskId,
      content,
    });
  };

  const handleUpdate = async (commentId: string, content: string) => {
    await updateCommentMutation.mutateAsync({
      id: commentId,
      content,
    });
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteCommentMutation.mutateAsync({
        id: commentId,
      });
    }
  };

  const handleTogglePin = async (
    commentId: string,
    isPinned: boolean | null
  ) => {
    await togglePinMutation.mutateAsync({
      id: commentId,
      isPinned: !isPinned,
    });
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    await addReactionMutation.mutateAsync({
      commentId,
      emoji,
    });
  };

  // Filter comments by search query
  const filteredComments = comments?.filter((comment) =>
    comment.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned and regular comments
  const pinnedComments = filteredComments?.filter((c) => c.isPinned) || [];
  const regularComments = filteredComments?.filter((c) => !c.isPinned) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">
            Comments {comments && `(${comments.length})`}
          </h3>
        </div>
      </div>

      {/* Search */}
      {comments && comments.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Comment Editor */}
      <CommentEditor onSubmit={handleCreate} autoFocus={false} />

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned Comments */}
          {pinnedComments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Pinned Comments
              </h4>
              {pinnedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isEditing={editingCommentId === comment.id}
                  onEdit={() => setEditingCommentId(comment.id)}
                  onCancelEdit={() => setEditingCommentId(null)}
                  onUpdate={(content) => handleUpdate(comment.id, content)}
                  onDelete={() => handleDelete(comment.id)}
                  onTogglePin={() =>
                    handleTogglePin(comment.id, comment.isPinned)
                  }
                  onReaction={(emoji) => handleReaction(comment.id, emoji)}
                />
              ))}
            </div>
          )}

          {/* Regular Comments */}
          {regularComments.length > 0 ? (
            <div className="space-y-2">
              {pinnedComments.length > 0 && (
                <h4 className="text-sm font-medium text-gray-700">
                  All Comments
                </h4>
              )}
              {regularComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isEditing={editingCommentId === comment.id}
                  onEdit={() => setEditingCommentId(comment.id)}
                  onCancelEdit={() => setEditingCommentId(null)}
                  onUpdate={(content) => handleUpdate(comment.id, content)}
                  onDelete={() => handleDelete(comment.id)}
                  onTogglePin={() =>
                    handleTogglePin(comment.id, comment.isPinned)
                  }
                  onReaction={(emoji) => handleReaction(comment.id, emoji)}
                />
              ))}
            </div>
          ) : null}

          {/* Empty State */}
          {filteredComments?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? (
                <>
                  <p className="font-medium">No matching comments found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </>
              ) : (
                <>
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No comments yet</p>
                  <p className="text-sm mt-1">
                    Be the first to comment on this task
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
