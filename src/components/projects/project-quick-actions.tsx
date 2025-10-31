'use client';

import { motion } from 'framer-motion';
import { Plus, BarChart3, Key, ArrowDown, Sparkles } from 'lucide-react';
import { GradientButton } from '@/components/ui/gradient-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectQuickActionsProps {
  projectId: string;
  projectType: 'general' | 'website';
  wpOneClickEnabled?: boolean | null;
  onNewTask: () => void;
  onAiChat: () => void;
  onAnalytics?: () => void;
  className?: string;
}

export function ProjectQuickActions({
  projectId,
  projectType: _projectType, // eslint-disable-line @typescript-eslint/no-unused-vars
  wpOneClickEnabled,
  onNewTask,
  onAiChat,
  onAnalytics,
  className,
}: ProjectQuickActionsProps) {
  const handleWordPressLogin = () => {
    window.open(`/api/wordpress/login?projectId=${projectId}`, '_blank');
  };

  const handleScrollToBoard = () => {
    const boardSection = document.querySelector('[data-board-section]');
    if (boardSection) {
      boardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3 mb-6', className)}>
      {/* Primary Action - New Task */}
      <GradientButton onClick={onNewTask} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        <span>New Task</span>
      </GradientButton>

      {/* AI Chat */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="outline"
          onClick={onAiChat}
          className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800 dark:text-purple-300"
        >
          <Sparkles className="h-4 w-4" />
          <span className="ml-2">Ask AI</span>
        </Button>
      </motion.div>

      {/* Analytics (optional) */}
      {onAnalytics && (
        <Button
          variant="outline"
          onClick={onAnalytics}
          className="bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Analytics</span>
        </Button>
      )}

      {/* WordPress Login (if enabled) */}
      {wpOneClickEnabled && (
        <Button
          variant="outline"
          onClick={handleWordPressLogin}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800 dark:text-blue-300"
        >
          <Key className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">WordPress</span>
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1 hidden sm:block" />

      {/* Scroll to Board */}
      <Button
        variant="ghost"
        onClick={handleScrollToBoard}
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <span className="text-sm">View Board</span>
        <ArrowDown className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
