'use client';

import { useState } from 'react';
import { Loader2, Trash2, CheckCircle, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMove?: () => void;
  onComplete?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  className?: string;
}

export function TaskBulkActions({
  selectedCount,
  onClearSelection,
  onMove,
  onComplete,
  onDelete,
  className,
}: TaskBulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedCount === 0) return null;

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
      onClearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-xl bg-gray-900 border border-white/20 shadow-2xl backdrop-blur-xl',
          className
        )}
      >
        <div className="flex items-center gap-2 px-3 border-r border-white/10">
          <span className="font-semibold text-white">{selectedCount}</span>
          <span className="text-sm text-gray-400">selected</span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        </div>

        {onComplete && (
          <button
            onClick={() => handleAction(onComplete)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm text-white transition-colors"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-400" />
            )}
            Complete
          </button>
        )}

        {onMove && (
          <button
            onClick={onMove}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-sm text-white transition-colors"
          >
            <ArrowRight className="h-4 w-4 text-blue-400" />
            Move
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => handleAction(onDelete)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-sm text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
