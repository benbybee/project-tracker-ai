'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AiChatWidget } from './ai-chat-widget';
import { cn } from '@/lib/utils';

interface AiChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  className?: string;
}

export function AiChatOverlay({
  isOpen,
  onClose,
  onMinimize,
  className = '',
}: AiChatOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Chat Widget Container */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              className
            )}
          >
            <AiChatWidget
              isOpen={isOpen}
              onClose={onClose}
              onMinimize={onMinimize}
              isMobile={false}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
