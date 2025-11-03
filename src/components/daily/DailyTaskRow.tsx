'use client';

import { format } from 'date-fns';
import { trpc } from '@/lib/trpc';
import type { Task } from '@/types/task';
import { parseDateAsLocal } from '@/lib/date-utils';

interface DailyTaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: (id: string, next: boolean) => void;
  onOpen: (t: Task) => void;
  showFollowUpAction?: boolean;
  daysInStatus?: number;
}

export default function DailyTaskRow({
  task,
  selected,
  onSelect,
  onOpen,
  showFollowUpAction = false,
  daysInStatus = 0,
}: DailyTaskRowProps) {
  const utils = trpc.useUtils();
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  const due = task.dueDate ? parseDateAsLocal(task.dueDate) : null;
  const overdue = !!(due && due.getTime() < Date.now());
  const dueToday = !!(due && new Date().toDateString() === due.toDateString());
  const daysStale = task.updatedAt
    ? (Date.now() - new Date(task.updatedAt).getTime()) / 86400000
    : 0;
  const stale = daysStale > 7;

  // Calculate days overdue
  const daysOverdue =
    due && overdue ? Math.floor((Date.now() - due.getTime()) / 86400000) : 0;

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

  async function createFollowUp() {
    if (!task.projectId) {
      alert('Cannot create follow-up: task has no project');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    await createTask.mutateAsync({
      projectId: task.projectId,
      title: `Follow up on: ${task.title}`,
      description: `Follow-up for task: ${task.title}\nOriginal task ID: ${task.id}\nStatus: ${task.status}`,
      dueDate: today,
      priorityScore: '4', // High priority
      status: 'not_started',
    });
  }

  return (
    <div className="group relative grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl border border-gray-200 bg-white/80 p-3 hover:shadow-md transition-all overflow-hidden">
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
            {overdue && daysOverdue > 0 && (
              <span className="rounded-full bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5">
                {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
              </span>
            )}
            {dueToday && (
              <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">
                Due Today
              </span>
            )}
            {showFollowUpAction && daysInStatus > 0 && (
              <span className="rounded-full bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5">
                {daysInStatus} {daysInStatus === 1 ? 'day' : 'days'} in{' '}
                {task.status}
              </span>
            )}
            {stale && !showFollowUpAction && (
              <span className="rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
                Stale {Math.floor(daysStale)}d
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
            Due {format(parseDateAsLocal(task.dueDate), 'MMM d')}
          </p>
        )}
      </button>
      {/* Quick actions */}
      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {showFollowUpAction && (
          <button
            onClick={createFollowUp}
            className="rounded bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            title="Create follow-up task due today"
          >
            Create Follow-up
          </button>
        )}
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
