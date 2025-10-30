'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Send,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommentEditorProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function CommentEditor({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = 'Write a comment... (Markdown supported)',
  submitLabel = 'Comment',
  autoFocus = false,
}: CommentEditorProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newText);

    // Set cursor position
    setTimeout(() => {
      const newCursor = start + before.length + selectedText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
      toast.success('Comment added successfully');
    } catch (error: any) {
      toast.error('Failed to add comment: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatButtons = [
    {
      icon: Bold,
      label: 'Bold',
      before: '**',
      after: '**',
      shortcut: 'Ctrl+B',
    },
    {
      icon: Italic,
      label: 'Italic',
      before: '_',
      after: '_',
      shortcut: 'Ctrl+I',
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      before: '~~',
      after: '~~',
    },
    { icon: Code, label: 'Inline Code', before: '`', after: '`' },
    { icon: Quote, label: 'Quote', before: '> ', after: '' },
    { icon: List, label: 'Bullet List', before: '- ', after: '' },
    { icon: ListOrdered, label: 'Numbered List', before: '1. ', after: '' },
    { icon: LinkIcon, label: 'Link', before: '[', after: '](url)' },
  ];

  return (
    <div className="space-y-2">
      {/* Formatting Toolbar */}
      <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-t-lg border border-gray-200 border-b-0">
        {formatButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => insertMarkdown(btn.before, btn.after)}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title={btn.label + (btn.shortcut ? ` (${btn.shortcut})` : '')}
          >
            <btn.icon className="h-4 w-4 text-gray-600" />
          </button>
        ))}

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor/Preview */}
      {showPreview ? (
        <div className="border border-gray-200 rounded-b-lg p-4 min-h-[120px] prose prose-sm max-w-none">
          {content ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <p className="text-gray-400">Nothing to preview</p>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[120px] rounded-t-none border-gray-200 focus:ring-2 focus:ring-blue-500"
          autoFocus={autoFocus}
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <span className="font-medium">Tip:</span> Markdown supported •
          Ctrl+Enter to submit
        </div>

        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-3 w-3 mr-1" />
            {isSubmitting ? 'Sending...' : submitLabel}
          </Button>
        </div>
      </div>

      {/* Task Linking Help */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
        <span className="font-medium">Link to tasks:</span> Use #TASK-123 to
        link to another task
      </div>
    </div>
  );
}
