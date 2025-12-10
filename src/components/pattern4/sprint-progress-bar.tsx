'use client';

import { cn } from '@/lib/utils';

interface SprintProgressBarProps {
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  className?: string;
  showStats?: boolean;
}

export function SprintProgressBar({
  completionPercentage,
  totalTasks,
  completedTasks,
  className,
  showStats = true,
}: SprintProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {showStats && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sprint Progress</span>
          <span className="font-semibold text-foreground">
            {completedTasks} / {totalTasks} tasks ({completionPercentage}%)
          </span>
        </div>
      )}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            completionPercentage === 100
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-indigo-500 to-violet-500'
          )}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  );
}

