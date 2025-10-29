'use client';

import { format } from 'date-fns';
import { trpc } from '@/lib/trpc-client';
import type { Task } from '@/types/task';

interface DailyTaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: (id: string, next: boolean) => void;
  onOpen: (t: Task) => void;
}

export default function DailyTaskRow({
  task,
  selected,
  onSelect,
  onOpen,
}: DailyTaskRowProps) {
  const utils = trpc.useUtils();
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!(due && due.getTime() < Date.now());
  const dueToday = !!(due && new Date().toDateString() === due.toDateString());
  const daysStale = task.updatedAt
    ? (Date.now() - new Date(task.updatedAt).getTime()) / 86400000
    : 0;
  const stale = daysStale > 7;

  async function update(patch: Partial<Task>) {
    await updateTask.mutateAsync({
      id: task.id,
      ...patch,
    });
  }

  async function defer(days: number) {
    const base = due ?? new Date();
    const newDue = new Date(base.getTime() + days * 86400000)
      .toISOString()
      .split('T')[0];
    await update({ dueDate: newDue });
  }

  return (
    <div className="group grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl border border-gray-200 bg-white/80 p-3 hover:shadow-md transition-all">
      <input
        aria-label="Select task"
        type="checkbox"
        className="mt-0.5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
        checked={selected}
        onChange={(e) => onSelect(task.id, e.target.checked)}
      />
      <button
        onClick={() => onOpen(task)}
        className="text-left min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">
            {task.title}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {overdue && (
              <span className="rounded-full bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5">
                Overdue
              </span>
            )}
            {dueToday && (
              <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">
                Due Today
              </span>
            )}
            {stale && (
              <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
                Stale
              </span>
            )}
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">
            {task.description}
          </p>
        )}
        {task.dueDate && (
          <p className="text-xs text-gray-500 mt-1">
            Due {format(new Date(task.dueDate), 'MMM d')}
          </p>
        )}
      </button>
      {/* Quick actions */}
      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <select
          aria-label="Status"
          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={task.status}
          onChange={(e) => update({ status: e.target.value as Task['status'] })}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </select>
        <button
          onClick={() => defer(1)}
          className="hidden sm:block rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 transition-colors"
          title="Defer 1 day"
        >
          +1d
        </button>
        <button
          onClick={() => defer(2)}
          className="hidden sm:block rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 transition-colors"
          title="Defer 2 days"
        >
          +2d
        </button>
        <button
          onClick={() => defer(7)}
          className="hidden sm:block rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 transition-colors"
          title="Defer 1 week"
        >
          +1w
        </button>
      </div>
    </div>
  );
}
