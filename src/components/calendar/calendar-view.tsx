'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { DayView } from './day-view';
import { trpc } from '@/lib/trpc';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import {
  type CalendarView as ViewType,
  type CalendarEvent,
  getMonthName,
  addMonths,
  addDays,
} from '@/lib/calendar-utils';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch all tasks for the current period
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({});

  // Convert tasks to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    if (!tasks) return [];

    return tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: new Date(task.dueDate!),
        allDay: true,
        color: task.role?.color || undefined,
        projectId: task.projectId,
        projectName: task.projectName,
        status: task.status,
        priority: task.priorityScore ? parseInt(task.priorityScore) : undefined,
      }));
  }, [tasks]);

  // Navigation handlers
  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = () => {
    setCreateModalOpen(true);
  };

  // Format title based on view
  const getTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === 'month') {
      return `${getMonthName(month)} ${year}`;
    } else if (view === 'week') {
      // Show week range
      const weekStart = addDays(currentDate, -currentDate.getDay());
      const weekEnd = addDays(weekStart, 6);

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${getMonthName(weekStart.getMonth())} ${weekStart.getDate()}-${weekEnd.getDate()}, ${year}`;
      } else {
        return `${getMonthName(weekStart.getMonth())} ${weekStart.getDate()} - ${getMonthName(weekEnd.getMonth())} ${weekEnd.getDate()}, ${year}`;
      }
    } else if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return '';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 px-3"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="rounded-none border-r"
            >
              Day
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="rounded-none border-r"
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="rounded-none"
            >
              Month
            </Button>
          </div>

          {/* Create Task Button */}
          <Button
            onClick={() => {
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading calendar...</p>
          </div>
        ) : view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
          />
        ) : view === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
          />
        ) : (
          <DayView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <TaskCreateModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
        projectId={undefined}
        defaultStatus="not_started"
      />
    </div>
  );
}
