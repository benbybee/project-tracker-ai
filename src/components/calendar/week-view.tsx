'use client';

import {
  type CalendarEvent,
  getWeekDays,
  isToday,
  getEventsForDay,
  getEventColor,
  getShortDayName,
} from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
}

export function WeekView({ currentDate, events }: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);

  return (
    <div className="h-full flex flex-col">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
        {weekDays.map((date, index) => {
          const isNow = isToday(date);
          return (
            <div
              key={index}
              className={cn(
                'p-3 text-center border-l border-gray-200 dark:border-gray-700 first:border-l-0',
                isNow && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getShortDayName(date.getDay())}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold',
                  isNow
                    ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                    : 'text-gray-900 dark:text-white'
                )}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Columns with Tasks */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 h-full">
          {weekDays.map((date, dayIndex) => {
            const dayEvents = getEventsForDay(events, date);
            const isNow = isToday(date);

            return (
              <div
                key={dayIndex}
                className={cn(
                  'border-l border-gray-200 dark:border-gray-700 p-2 min-h-[200px] first:border-l-0',
                  isNow && 'bg-blue-50/30 dark:bg-blue-900/10'
                )}
              >
                {/* Tasks List */}
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="text-xs px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                      style={{
                        backgroundColor: getEventColor(event) + '20',
                        borderLeft: `3px solid ${getEventColor(event)}`,
                      }}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Open task details modal
                      }}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      {event.projectName && (
                        <div className="truncate text-gray-600 dark:text-gray-400 mt-0.5">
                          {event.projectName}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
