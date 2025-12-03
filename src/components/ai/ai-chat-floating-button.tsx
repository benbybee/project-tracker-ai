'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiChatFloatingButtonProps {
  onClick: () => void;
  className?: string;
}

export function AiChatFloatingButton({
  onClick,
  className = '',
}: AiChatFloatingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'w-14 h-14 rounded-full',
        'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all duration-300',
        'focus:outline-none focus:ring-4 focus:ring-purple-500/50',
        'group',
        className
      )}
      aria-label="Open AI Chat"
    >
      <Bot className="h-7 w-7 text-white group-hover:scale-110 transition-transform" />

      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />
    </motion.button>
  );
}
