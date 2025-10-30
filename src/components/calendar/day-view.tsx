'use client';

import {
  type CalendarEvent,
  getTimeSlots,
  getEventsForDay,
  getEventColor,
  formatDate,
  formatTime,
} from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

export function DayView({ currentDate, events, onDateClick }: DayViewProps) {
  const timeSlots = getTimeSlots(30); // 30-minute intervals
  const dayEvents = getEventsForDay(events, currentDate);

  // Separate all-day and timed events
  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);

  return (
    <div className="h-full flex flex-col">
      {/* Date Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {formatDate(currentDate, 'full')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {dayEvents.length} {dayEvents.length === 1 ? 'task' : 'tasks'}{' '}
          scheduled
        </p>
      </div>

      {/* All-Day Events Section */}
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            All Day
          </h3>
          <div className="space-y-2">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: getEventColor(event) + '20',
                  borderLeft: `4px solid ${getEventColor(event)}`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open task details modal
                }}
              >
                <div className="font-medium text-sm">{event.title}</div>
                {event.projectName && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {event.projectName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[80px_1fr]">
          {timeSlots.map((time, index) => (
            <div key={index} className="contents">
              {/* Time Label */}
              <div className="p-2 text-sm text-right text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                {time}
              </div>

              {/* Time Slot */}
              <div
                className={cn(
                  'border-b border-gray-200 dark:border-gray-700 p-2 min-h-[60px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                  index % 2 === 0 &&
                    'border-t border-gray-300 dark:border-gray-600'
                )}
                onClick={() => onDateClick(currentDate)}
              >
                {/* Timed events would be positioned here based on their start time */}
                {/* For now, we'll show them in the all-day section */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
        <button
          onClick={() => onDateClick(currentDate)}
          className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          + Add task for this day
        </button>
      </div>
    </div>
  );
}
