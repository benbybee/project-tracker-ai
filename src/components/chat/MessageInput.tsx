'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, AtSign, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtime } from '@/app/providers';

interface MessageInputProps {
  threadId: string;
  onSendMessage: (
    content: string,
    messageType?: string,
    metadata?: any
  ) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  threadId,
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { broadcastChatTyping } = useRealtime();

  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (value: string) => {
    setContent(value);

    // Handle typing indicators
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping?.(true);
      broadcastChatTyping(threadId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
      broadcastChatTyping(threadId, false);
    }, 1000);
  };

  const handleSend = () => {
    if (content.trim() && !disabled) {
      const messageContent = content.trim();

      // Check for mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = messageContent.match(mentionRegex);
      const messageType = mentions ? 'mention' : 'text';

      onSendMessage(messageContent, messageType, {
        mentions: mentions || [],
      });

      setContent('');
      setIsTyping(false);
      onTyping?.(false);
      broadcastChatTyping(threadId, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);

      // Focus and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleMentionSelect = (username: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.slice(0, start) + `@${username} ` + content.slice(end);
      setContent(newContent);

      // Focus and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + username.length + 2,
          start + username.length + 2
        );
      }, 0);
    }
    setShowMentionPicker(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        broadcastChatTyping(threadId, false);
      }
    };
  }, [isTyping, threadId, broadcastChatTyping]);

  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥'];

  return (
    <div className="relative">
      <div className="flex items-end space-x-2 p-3 bg-white border-t border-gray-200">
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Mention Picker */}
          {showMentionPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
              <div className="text-xs text-gray-500 mb-1">Mention someone:</div>
              <div className="space-y-1">
                {['john', 'jane', 'mike', 'sarah'].map((username) => (
                  <button
                    key={username}
                    onClick={() => handleMentionSelect(username)}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  >
                    @{username}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
              <div className="text-xs text-gray-500 mb-1">Add emoji:</div>
              <div className="flex space-x-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="hover:bg-gray-100 rounded p-1 text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMentionPicker(!showMentionPicker)}
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <AtSign className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!content.trim() || disabled}
            className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
