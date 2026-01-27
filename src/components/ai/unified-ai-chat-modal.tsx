'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnifiedAiChat, ChatContext } from './unified-ai-chat';
import { GlassCard } from '@/components/ui/glass-card';

interface UnifiedAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
  onSendMessage?: (message: string, context?: ChatContext) => Promise<string>;
  initialMessage?: string | null;
}

export function UnifiedAiChatModal({
  isOpen,
  onClose,
  context,
  onSendMessage,
  initialMessage,
}: UnifiedAiChatModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-3xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 3rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="flex-1 flex flex-col overflow-hidden relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Chat Component */}
              <UnifiedAiChat
                context={context}
                onSendMessage={onSendMessage}
                initialMessage={initialMessage}
                className="flex-1 border-0 shadow-none"
              />
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
