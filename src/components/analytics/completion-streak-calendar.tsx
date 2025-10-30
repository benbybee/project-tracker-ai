'use client';

import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { Flame, Trophy } from 'lucide-react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  completionDates: Date[];
}

interface CompletionStreakCalendarProps {
  data: StreakData;
  title?: string;
}

const LEVEL_COLORS = {
  0: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  1: 'bg-green-200 dark:bg-green-900 border-green-300 dark:border-green-800',
  2: 'bg-green-400 dark:bg-green-700 border-green-500 dark:border-green-600',
  3: 'bg-green-600 dark:bg-green-600 border-green-700 dark:border-green-500',
  4: 'bg-green-800 dark:bg-green-500 border-green-900 dark:border-green-400',
};

export function CompletionStreakCalendar({
  data,
  title = 'Completion Streak',
}: CompletionStreakCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Get calendar days (including leading/trailing days)
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Create a map of completion dates for quick lookup
  const completionMap = React.useMemo(() => {
    const map = new Map<string, number>();
    data.completionDates.forEach((date) => {
      const key = format(date, 'yyyy-MM-dd');
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [data.completionDates]);

  // Calculate max count for level scaling
  const maxCount = React.useMemo(() => {
    return Math.max(...Array.from(completionMap.values()), 1);
  }, [completionMap]);

  // Get level for a date
  const getLevel = (date: Date): number => {
    const key = format(date, 'yyyy-MM-dd');
    const count = completionMap.get(key) || 0;

    if (count === 0) return 0;
    if (count >= maxCount * 0.75) return 4;
    if (count >= maxCount * 0.5) return 3;
    if (count >= maxCount * 0.25) return 2;
    return 1;
  };

  // Group days by week
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  if (data.completionDates.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <Flame className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No streak yet</p>
          <p className="text-xs mt-1">
            Complete tasks consistently to build a streak
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
          {title}
        </h3>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {data.currentStreak}
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-300">
                Current Streak
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {data.longestStreak}
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                Longest Streak
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div>
        <div className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          {format(today, 'MMMM yyyy')}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div
              key={i}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center h-8 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((date, dayIndex) => {
                const isCurrentMonth = date >= monthStart && date <= monthEnd;
                const isToday = isSameDay(date, today);
                const level = getLevel(date);
                const count =
                  completionMap.get(format(date, 'yyyy-MM-dd')) || 0;
                const colorClass =
                  LEVEL_COLORS[level as keyof typeof LEVEL_COLORS];

                return (
                  <div
                    key={dayIndex}
                    className={`
                      relative h-10 rounded border flex items-center justify-center
                      text-xs font-medium transition-all cursor-pointer
                      ${colorClass}
                      ${!isCurrentMonth && 'opacity-30'}
                      ${isToday && 'ring-2 ring-blue-500 ring-offset-1'}
                      hover:scale-110 hover:z-10 hover:shadow-lg
                    `}
                    title={`${format(date, 'MMM d, yyyy')} - ${count} task(s)`}
                  >
                    <span
                      className={
                        level >= 3
                          ? 'text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }
                    >
                      {format(date, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-600 dark:text-slate-400">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-4 h-4 rounded border ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`}
          />
        ))}
        <span className="text-xs text-slate-600 dark:text-slate-400">More</span>
      </div>
    </div>
  );
}
