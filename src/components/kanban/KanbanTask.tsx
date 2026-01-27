'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '@/types/task';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { CalendarDays, ChevronDown, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseDateAsLocal, formatDateShort } from '@/lib/date-utils';
import { TaskStatusPicker } from '@/components/mobile/task-status-picker';
import { trpc } from '@/lib/trpc';
import { useRealtime } from '@/app/providers';

interface KanbanTaskProps {
  task: Task;
  isTouchDevice?: boolean;
}

export function KanbanTask({ task, isTouchDevice = false }: KanbanTaskProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const realtime = useRealtime();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task, col: task.status },
  });

  const utils = trpc.useUtils();
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate status badges
  const due = task.dueDate ? parseDateAsLocal(task.dueDate) : null;
  const daysStale = task.updatedAt
    ? (Date.now() - new Date(task.updatedAt).getTime()) / 86400000
    : 0;
  const overdue = !!(due && due.getTime() < Date.now());
  const dueToday = !!(due && new Date().toDateString() === due.toDateString());
  const stale = daysStale > 7 && !task.dueDate; // Only show stale if no due date

  const p = task.priorityScore
    ? (Number(task.priorityScore) as 1 | 2 | 3 | 4)
    : 2;

  const getPriorityColor = (priority: 1 | 2 | 3 | 4): string => {
    const map: Record<1 | 2 | 3 | 4, string> = {
      1: '#9CA3AF', // Gray
      2: '#3B82F6', // Blue
      3: '#F97316', // Orange
      4: '#EF4444', // Red
    };
    return map[priority];
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: newStatus,
      });

      // Broadcast real-time update
      realtime.broadcastActivity({
        type: 'task_updated',
        entityType: 'task',
        entityId: task.id,
        data: {
          taskId: task.id,
          status: newStatus,
          projectId: task.projectId,
          ticketId: task.ticketId,
        },
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking the status button
    if ((e.target as HTMLElement).closest('[data-status-button]')) {
      return;
    }
    if (!isDragging) {
      setEditOpen(true);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(!isTouchDevice ? listeners : {})} // Only attach drag listeners on non-touch devices
        className={cn(
          'group relative rounded-xl p-3 bg-white shadow-sm border border-gray-200',
          'card-hover', // Add hover animation
          'transition-all duration-200',
          !isTouchDevice && 'cursor-grab active:cursor-grabbing',
          isTouchDevice && 'cursor-pointer',
          'flex flex-col gap-2',
          isDragging && 'opacity-50 rotate-2',
          p === 4 && !['completed'].includes(task.status) && 'priority-pulse' // Pulse for P4 urgent tasks
        )}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h4 className="font-semibold text-sm leading-snug flex-1 min-w-0 break-words flex items-center gap-1">
              {task.isRecurring && (
                <span title="Recurring task" className="flex-shrink-0">
                  <Repeat className="h-3 w-3 text-blue-600 shrink-0" />
                </span>
              )}
              <span className="break-words">{task.title}</span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-1">
            <span
              className="px-2 py-0.5 text-xs rounded-full font-medium"
              style={{
                backgroundColor: `${getPriorityColor(p)}1A`,
                color: getPriorityColor(p),
              }}
            >
              Priority P{p}
            </span>
            {overdue && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                Overdue
              </span>
            )}
            {!overdue && dueToday && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                Due Today
              </span>
            )}
            {stale && !overdue && !dueToday && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
                Stale
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Mobile Status Change Button */}
        {isTouchDevice && (
          <button
            data-status-button
            onClick={(e) => {
              e.stopPropagation();
              setStatusPickerOpen(true);
            }}
            className="lg:hidden flex items-center gap-2 px-3 py-2 mt-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors active:scale-98"
          >
            <span>Change Status</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        )}

        {/* Footer metadata */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 min-w-0">
          {task.projectName && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 truncate max-w-full">
              {task.projectName}
            </span>
          )}
          {task.role && (
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 truncate">
              {typeof task.role === 'string' ? task.role : task.role.name}
            </span>
          )}
          {/* RE-ENABLED - Phase 5 */}
          {task.dueDate && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <CalendarDays className="h-3 w-3" />
              <span className="whitespace-nowrap">
                {(() => {
                  // Handle Date objects returned by Drizzle ORM (runtime check)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  if ((task.dueDate as any) instanceof Date) {
                    return (task.dueDate as any as Date).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric' }
                    );
                  }
                  // Handle string dates
                  return formatDateShort(task.dueDate);
                })()}
              </span>
            </span>
          )}
        </div>
      </div>

      <TaskEditModal
        task={task}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <TaskStatusPicker
        isOpen={statusPickerOpen}
        onClose={() => setStatusPickerOpen(false)}
        currentStatus={task.status as TaskStatus}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
