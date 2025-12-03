'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TaskCard } from '@/components/tasks/task-card';
import { GlassCard } from '@/components/ui/glass-card';
import type { Task } from '@/types/task';

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'info';
  defaultExpanded?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: Task['status']) => void;
  emptyMessage?: string;
}

export function TaskSection({
  title,
  tasks,
  icon,
  variant = 'default',
  defaultExpanded = false,
  onTaskClick,
  onTaskComplete,
  onTaskStatusChange,
  emptyMessage = 'No tasks in this section',
}: TaskSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const variantStyles = {
    default: {
      bgColor: 'bg-slate-50 dark:bg-slate-800/50',
      borderColor: 'border-slate-200 dark:border-slate-700',
      textColor: 'text-slate-900 dark:text-slate-100',
      badgeColor:
        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    },
    warning: {
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-900 dark:text-amber-100',
      badgeColor:
        'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200',
    },
    danger: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-100',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200',
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-100',
      badgeColor:
        'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200',
    },
  };

  const styles = variantStyles[variant];

  if (tasks.length === 0) {
    return null; // Don't show empty sections
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 rounded-lg border ${styles.bgColor} ${styles.borderColor} transition-all hover:shadow-sm`}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <h3 className={`font-semibold ${styles.textColor}`}>{title}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${styles.badgeColor}`}
          >
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 overflow-hidden"
          >
            {tasks.length === 0 ? (
              <GlassCard className="text-center py-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </p>
              </GlassCard>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={onTaskClick}
                  onComplete={onTaskComplete}
                  onStatusChange={onTaskStatusChange}
                  className="hover:shadow-md transition-shadow"
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
