'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseDateAsLocal } from '@/lib/date-utils';

interface KanbanTaskProps {
  task: Task;
}

export function KanbanTask({ task }: KanbanTaskProps) {
  const [editOpen, setEditOpen] = useState(false);

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
  const stale = daysStale > 7;

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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'group relative rounded-xl p-3 bg-white shadow-sm border border-gray-200',
          'hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing',
          'flex flex-col gap-2',
          isDragging && 'opacity-50 rotate-2'
        )}
        onClick={() => {
          // Only open modal if not dragging
          if (!isDragging) {
            setEditOpen(true);
          }
        }}
      >
        {/* Priority corner ribbon */}
        <div
          className="absolute top-0 right-0 w-0 h-0 pointer-events-none"
          style={{
            borderStyle: 'solid',
            borderWidth: '0 28px 28px 0',
            borderColor: `transparent ${getPriorityColor(p)} transparent transparent`,
          }}
          aria-label={`Priority ${p}`}
        />

        {/* Header with title and badges */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-snug flex-1 min-w-0 truncate">
            {task.title}
          </h4>
          <div className="flex gap-1 shrink-0 flex-wrap">
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

        {/* Footer metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {task.projectName && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {task.projectName}
            </span>
          )}
          {task.role && (
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {typeof task.role === 'string' ? task.role : task.role.name}
            </span>
          )}
          {due && task.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {due.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <TaskEditModal
        task={task}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
