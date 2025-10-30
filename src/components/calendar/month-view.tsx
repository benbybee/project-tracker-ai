'use client';

import {
  type CalendarEvent,
  getMonthDays,
  isSameDay,
  isToday,
  isCurrentMonth,
  getEventsForDay,
  getEventColor,
  getShortDayName,
} from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

export function MonthView({
  currentDate,
  events,
  onDateClick,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);

  return (
    <div className="h-full flex flex-col">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {getShortDayName(day)}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr border-l border-t border-gray-200 dark:border-gray-700">
        {days.map((date, index) => {
          const dayEvents = getEventsForDay(events, date);
          const isThisMonth = isCurrentMonth(date, month);
          const isNow = isToday(date);

          return (
            <div
              key={index}
              className={cn(
                'border-r border-b border-gray-200 dark:border-gray-700 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                !isThisMonth && 'bg-gray-50 dark:bg-gray-900'
              )}
              onClick={() => onDateClick(date)}
            >
              {/* Date Number */}
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isThisMonth
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-600',
                    isNow &&
                      'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs px-2 py-1 rounded truncate"
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
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 pl-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
