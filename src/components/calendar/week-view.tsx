'use client';

import {
  type CalendarEvent,
  getWeekDays,
  getTimeSlots,
  isToday,
  getEventsForDay,
  getEventColor,
  getShortDayName,
  formatDate,
} from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

export function WeekView({ currentDate, events, onDateClick }: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);
  const timeSlots = getTimeSlots(60); // 1-hour intervals

  return (
    <div className="h-full flex flex-col">
      {/* Day Headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
        <div className="p-2" /> {/* Empty corner */}
        {weekDays.map((date, index) => {
          const isNow = isToday(date);
          return (
            <div
              key={index}
              className={cn(
                'p-2 text-center border-l border-gray-200 dark:border-gray-700',
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

      {/* Time Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="contents">
              {/* Time Label */}
              <div className="p-2 text-xs text-right text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                {time}
              </div>

              {/* Day Columns */}
              {weekDays.map((date, dayIndex) => {
                const dayEvents = getEventsForDay(events, date);
                const isNow = isToday(date);

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      'border-l border-b border-gray-200 dark:border-gray-700 p-1 min-h-[60px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative',
                      isNow && 'bg-blue-50/50 dark:bg-blue-900/10'
                    )}
                    onClick={() => onDateClick(date)}
                  >
                    {/* Show all-day events at the top */}
                    {timeIndex === 0 &&
                      dayEvents
                        .filter((e) => e.allDay)
                        .map((event) => (
                          <div
                            key={event.id}
                            className="text-xs px-2 py-1 rounded mb-1 truncate"
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
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
