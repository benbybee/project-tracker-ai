'use client';

import { trpc } from '@/lib/trpc';
import { GlassCard } from '@/components/ui/glass-card';
import {
  CheckCircle,
  Circle,
  MoreVertical,
  Edit2,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Habit, HabitLog } from '@/server/db/schema/habits';
import { format } from 'date-fns';

interface HabitListProps {
  habits: Habit[];
  logs: HabitLog[];
  date: Date;
  onEdit: (habit: Habit) => void;
}

export function HabitList({ habits, logs, date, onEdit }: HabitListProps) {
  const utils = trpc.useUtils();
  const toggleCompletion = trpc.habits.toggleCompletion.useMutation({
    onSuccess: () => {
      utils.habits.getLogs.invalidate();
      // Optimistic update could be done here too
    },
  });
  const archiveHabit = trpc.habits.update.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
    },
  });

  const isCompleted = (habitId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.some((log) => {
      const logDate =
        (log.completedDate as unknown) instanceof Date
          ? format(log.completedDate as unknown as Date, 'yyyy-MM-dd')
          : log.completedDate;
      return log.habitId === habitId && logDate === dateStr;
    });
  };

  const handleToggle = async (habitId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await toggleCompletion.mutateAsync({ habitId, date: dateStr });
  };

  const handleArchive = async (habitId: string) => {
    if (confirm('Are you sure you want to archive this habit?')) {
      await archiveHabit.mutateAsync({ id: habitId, archived: true });
    }
  };

  // Group by time of day
  const groupedHabits = {
    morning: habits.filter((h) => h.timeOfDay === 'morning'),
    afternoon: habits.filter((h) => h.timeOfDay === 'afternoon'),
    evening: habits.filter((h) => h.timeOfDay === 'evening'),
    anytime: habits.filter((h) => h.timeOfDay === 'anytime'),
  };

  const renderHabitGroup = (title: string, groupHabits: Habit[]) => {
    if (groupHabits.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
          {title}
        </h3>
        <div className="space-y-3">
          {groupHabits.map((habit) => {
            const completed = isCompleted(habit.id);
            return (
              <GlassCard
                key={habit.id}
                className={cn(
                  'p-4 flex items-center justify-between transition-all duration-200',
                  completed
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'hover:border-indigo-500/30'
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={cn(
                      'transition-all duration-200 transform active:scale-90 focus:outline-none',
                      completed
                        ? 'text-green-500'
                        : 'text-slate-300 hover:text-indigo-400'
                    )}
                  >
                    {completed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                  <div>
                    <h4
                      className={cn(
                        'font-medium text-slate-900 dark:text-white transition-all',
                        completed &&
                          'text-slate-500 line-through decoration-slate-500/50'
                      )}
                    >
                      {habit.title}
                    </h4>
                    {habit.description && (
                      <p className="text-xs text-slate-500">
                        {habit.description}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-50 hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(habit)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleArchive(habit.id)}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </GlassCard>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {renderHabitGroup('Morning', groupedHabits.morning)}
      {renderHabitGroup('Afternoon', groupedHabits.afternoon)}
      {renderHabitGroup('Evening', groupedHabits.evening)}
      {renderHabitGroup('Anytime', groupedHabits.anytime)}
    </div>
  );
}
