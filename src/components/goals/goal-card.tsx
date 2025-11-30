'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Edit2, Trash2, Target, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal } from '@/server/db/schema/goals';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const statusColors = {
    not_started: 'bg-slate-500/20 text-slate-500 dark:text-slate-400',
    in_progress: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    completed: 'bg-green-500/20 text-green-600 dark:text-green-400',
    on_hold: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  };

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    on_hold: 'On Hold',
  };

  const categoryColors = {
    career: 'text-purple-500 bg-purple-500/10',
    health: 'text-red-500 bg-red-500/10',
    finance: 'text-green-500 bg-green-500/10',
    personal: 'text-blue-500 bg-blue-500/10',
    learning: 'text-yellow-500 bg-yellow-500/10',
    other: 'text-slate-500 bg-slate-500/10',
  };

  return (
    <GlassCard className="flex flex-col h-full p-5 group hover:border-indigo-500/30 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider',
              categoryColors[goal.category as keyof typeof categoryColors] ||
                categoryColors.other
            )}
          >
            {goal.category}
          </span>
          <span
            className={cn(
              'text-xs font-medium px-2.5 py-0.5 rounded-full',
              statusColors[goal.status as keyof typeof statusColors]
            )}
          >
            {statusLabels[goal.status as keyof typeof statusLabels]}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(goal)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
        <Target className="h-4 w-4 text-indigo-500" />
        {goal.title}
      </h3>

      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 flex-1">
        {goal.description || 'No description provided.'}
      </p>

      <div className="space-y-4 mt-auto">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Progress</span>
            <span>{goal.progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200/50 dark:border-white/5">
          {goal.targetDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {goal.status === 'completed' && (
            <div className="flex items-center gap-1.5 text-green-500 ml-auto">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Achieved</span>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
