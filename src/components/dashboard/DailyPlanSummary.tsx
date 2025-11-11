'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

interface DailyPlanSummaryProps {
  roleId?: string | null;
}

export function DailyPlanSummary({ roleId }: DailyPlanSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch daily plan tasks
  const { data: dailyPlanTasks = [], isLoading } = trpc.tasks.list.useQuery({
    isDailyOnly: true,
    roleId: roleId || undefined,
  });

  const utils = trpc.useUtils();
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  const handleCheckboxChange = async (taskId: string, completed: boolean) => {
    await updateTaskMutation.mutateAsync({
      id: taskId,
      status: completed ? 'completed' : 'not_started',
    });
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    await updateTaskMutation.mutateAsync({
      id: taskId,
      status,
    });
  };

  const activeTasks = dailyPlanTasks.filter((t) => t.status !== 'completed');
  const completedTasks = dailyPlanTasks.filter((t) => t.status === 'completed');

  if (isLoading) {
    return (
      <GlassCard className="animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </GlassCard>
    );
  }

  if (dailyPlanTasks.length === 0) {
    return (
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Daily Plan
            </h3>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          No tasks in your daily plan yet.
        </p>
        <Link
          href="/daily"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Go to Daily Planner to set your plan →
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Today's Daily Plan
          </h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {activeTasks.length} active
            {completedTasks.length > 0 && ` • ${completedTasks.length} done`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/daily"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full Planner →
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            {/* Active tasks */}
            {activeTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onCheckboxChange={handleCheckboxChange}
                onStatusChange={handleStatusChange}
              />
            ))}

            {/* Completed tasks (collapsed) */}
            {completedTasks.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  {completedTasks.length} completed task
                  {completedTasks.length !== 1 ? 's' : ''}
                </summary>
                <div className="mt-2 space-y-2">
                  {completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onCheckboxChange={handleCheckboxChange}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

interface TaskRowProps {
  task: Task;
  onCheckboxChange: (taskId: string, completed: boolean) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

function TaskRow({ task, onCheckboxChange, onStatusChange }: TaskRowProps) {
  const isCompleted = task.status === 'completed';
  const p = task.priorityScore
    ? (Number(task.priorityScore) as 1 | 2 | 3 | 4)
    : 2;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-slate-700',
        'hover:bg-white dark:hover:bg-white/10',
        isCompleted && 'opacity-60'
      )}
    >
      {/* Priority indicator */}
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: getPriorityColor(p) }}
        aria-label={`Priority ${p}`}
      />

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={(e) => onCheckboxChange(task.id, e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
        aria-label="Mark as complete"
      />

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-medium text-sm text-slate-900 dark:text-slate-100',
            isCompleted && 'line-through text-slate-500'
          )}
        >
          {task.title}
        </div>
        {task.projectName && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {task.projectName}
          </div>
        )}
      </div>

      {/* Status dropdown */}
      <select
        value={task.status}
        onChange={(e) =>
          onStatusChange(task.id, e.target.value as Task['status'])
        }
        className={cn(
          'text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1',
          'bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500',
          'cursor-pointer flex-shrink-0'
        )}
        aria-label="Change status"
      >
        <option value="not_started">Not Started</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="completed">Completed</option>
        <option value="content">Content</option>
        <option value="design">Design</option>
        <option value="dev">Dev</option>
        <option value="qa">QA</option>
        <option value="launch">Launch</option>
      </select>
    </motion.div>
  );
}

function getPriorityColor(p: 1 | 2 | 3 | 4): string {
  const map: Record<1 | 2 | 3 | 4, string> = {
    1: '#9CA3AF', // Gray
    2: '#3B82F6', // Blue
    3: '#F97316', // Orange
    4: '#EF4444', // Red
  };
  return map[p];
}
