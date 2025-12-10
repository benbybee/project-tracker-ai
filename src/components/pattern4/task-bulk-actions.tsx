'use client';

import { useState } from 'react';
import { Trash2, CheckCircle, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMove?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
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
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-xl bg-gray-900 border border-white/20 shadow-2xl backdrop-blur-xl',
          className
        )}
      >
        <div className="flex items-center gap-2 px-3 border-r border-white/10">
          <span className="text-sm font-medium text-white">
            {selectedCount} selected
          </span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {onMove && (
            <button
              onClick={onMove}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Move
            </button>
          )}

          {onComplete && (
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

