'use client';

import { useState } from 'react';
import {
  type CalendarEvent,
  getMonthDays,
  isToday,
  isCurrentMonth,
  getEventsForDay,
  getEventColor,
  getShortDayName,
} from '@/lib/calendar-utils';
import { cn } from '@/lib/utils';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DayTasksModal } from './day-tasks-modal';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';

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

  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [dayTasksModalDate, setDayTasksModalDate] = useState<Date | null>(null);
  const [createTaskDate, setCreateTaskDate] = useState<Date | null>(null);

  return (
    <>
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
            const isHovered = hoveredDate?.getTime() === date.getTime();

            return (
              <div
                key={index}
                className={cn(
                  'border-r border-b border-gray-200 dark:border-gray-700 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative',
                  !isThisMonth && 'bg-gray-50 dark:bg-gray-900'
                )}
                onClick={() => onDateClick(date)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
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

                  {/* Hover Actions */}
                  {isHovered && (
                    <div className="flex gap-1 z-10">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateTaskDate(date);
                        }}
                        title="Add task"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayTasksModalDate(date);
                        }}
                        title="View all tasks"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
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
                        setDayTasksModalDate(date);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <button
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 pl-2 cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDayTasksModalDate(date);
                      }}
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Tasks Modal */}
      <DayTasksModal
        date={dayTasksModalDate}
        events={
          dayTasksModalDate ? getEventsForDay(events, dayTasksModalDate) : []
        }
        open={dayTasksModalDate !== null}
        onClose={() => setDayTasksModalDate(null)}
      />

      {/* Create Task Modal */}
      <TaskCreateModal
        open={createTaskDate !== null}
        onClose={() => setCreateTaskDate(null)}
        projectId={undefined}
        defaultStatus="not_started"
        defaultDueDate={createTaskDate?.toISOString().split('T')[0]}
      />
    </>
  );
}
