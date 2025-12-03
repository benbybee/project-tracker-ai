'use client';

import { GlassCard } from '@/components/ui/glass-card';
import type { Habit, HabitLog } from '@/server/db/schema/habits';
import { Flame, Trophy, CheckCircle2 } from 'lucide-react';

import { format } from 'date-fns';

interface HabitStatsProps {
  habits: Habit[];
  logs: HabitLog[];
}

export function HabitStats({ habits, logs }: HabitStatsProps) {
  // Simple stats
  const totalHabits = habits.length;
  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = logs.filter((log) => {
    const logDate =
      (log.completedDate as unknown) instanceof Date
        ? format(log.completedDate as unknown as Date, 'yyyy-MM-dd')
        : log.completedDate;
    return logDate === today;
  }).length;
  const completionRate =
    totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Mock streak (real calculation requires more logic)
  const currentStreak = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <GlassCard className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
          <Flame className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">
            Current Streak
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {currentStreak} days
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-green-500/10 text-green-500">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">
            Today's Progress
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {completedToday}/{totalHabits}
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({completionRate}%)
            </span>
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">
            Weekly Score
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            --
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
