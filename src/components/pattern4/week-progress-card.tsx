'use client';

import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface WeekProgressCardProps {
  week: {
    id: string;
    weekIndex: number;
    startDate: string;
    endDate: string;
    theme?: string | null;
  };
  progress: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
  className?: string;
}

export function WeekProgressCard({
  week,
  progress,
  className,
}: WeekProgressCardProps) {
  return (
    <Link
      href={`/pattern4/weeks/${week.id}`}
      className={cn(
        'group block p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold text-foreground">
              Week {week.weekIndex}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            {format(parseISO(week.startDate), 'MMM d')} -{' '}
            {format(parseISO(week.endDate), 'MMM d, yyyy')}
          </p>
          {week.theme && (
            <p className="text-sm text-foreground/80 mt-2">{week.theme}</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </div>

      {/* Progress Bar */}
      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">
            {progress.completedTasks}/{progress.totalTasks}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              progress.completionPercentage === 100
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500'
            )}
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

