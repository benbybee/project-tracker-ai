'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Trash2,
  CheckCircle2,
  AlarmClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type Role = { id: string; name: string; color: string };
export type Subtask = { id: number; title: string; completed: boolean };
export type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status:
    | 'not_started'
    | 'in_progress'
    | 'blocked'
    | 'completed'
    | 'content'
    | 'design'
    | 'dev'
    | 'qa'
    | 'launch';
  priorityScore: 1 | 2 | 3 | 4 | '1' | '2' | '3' | '4' | null;
  role?: Role | null;
  subtasks?: Subtask[];
  isDaily?: boolean;
  updatedAt?: string;
  projectName?: string;
  ticketId?: string;
  ticketStatus?: string;
  ticketTaskCount?: number;
};

export function TaskCard({
  task,
  onOpen,
  onComplete,
  onSnooze,
  onDelete,
  className,
}: {
  task: Task;
  onOpen?: (task: Task) => void;
  onComplete?: (taskId: string) => void;
  onSnooze?: (taskId: string, days: 1 | 2 | 3) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
  draggable?: boolean;
}) {
  const p = task.priorityScore
    ? (Number(task.priorityScore) as 1 | 2 | 3 | 4)
    : 2;
  const subDone = task.subtasks?.filter((s) => s.completed).length ?? 0;
  const subTotal = task.subtasks?.length ?? 0;
  const hasSubs = subTotal > 0;

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const { dueText, overdue } = dueBadge(due);

  // Calculate status indicators
  const daysStale = task.updatedAt
    ? (Date.now() - new Date(task.updatedAt).getTime()) / 86400000
    : 0;
  const dueToday = due && new Date().toDateString() === due.toDateString();
  const stale = daysStale > 7;

  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      onClick={() => onOpen?.(task)}
      className={cn(
        'group relative overflow-hidden rounded-xl border shadow-sm',
        'bg-white/80 dark:bg-white/10 border-gray-200 backdrop-blur',
        'hover:shadow-md cursor-pointer transition-all',
        className
      )}
    >
      {/* priority accent */}
      <div
        aria-hidden
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ backgroundImage: priorityGradient(p) }}
      />
      {/* content */}
      <div className="px-4 py-3 pl-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 leading-snug">
                {task.title}
              </h4>
              <div className="flex gap-1 flex-shrink-0">
                {overdue && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                    Overdue
                  </span>
                )}
                {dueToday && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                    Due Today
                  </span>
                )}
                {stale && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    Stale
                  </span>
                )}
              </div>
            </div>
            {task.projectName && (
              <div className="text-xs text-gray-500">{task.projectName}</div>
            )}
            {task.ticketId && (
              <div className="text-xs text-blue-600 mt-1">
                🎫 Ticket #{task.ticketId.slice(-8)}
                {task.ticketStatus && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                      task.ticketStatus === 'new'
                        ? 'bg-green-100 text-green-700'
                        : task.ticketStatus === 'viewed'
                          ? 'bg-blue-100 text-blue-700'
                          : task.ticketStatus === 'pending_tasks'
                            ? 'bg-orange-100 text-orange-700'
                            : task.ticketStatus === 'complete'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {task.ticketStatus.replace('_', ' ')}
                  </span>
                )}
                {task.ticketTaskCount && task.ticketTaskCount > 1 && (
                  <span className="ml-1 text-gray-500">
                    ({task.ticketTaskCount} tasks)
                  </span>
                )}
              </div>
            )}
            {task.description && (
              <p className="text-sm text-gray-700 line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
            {task.dueDate && (
              <div className="text-xs text-gray-500 mt-1">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
          <button
            className="ml-auto opacity-0 group-hover:opacity-100 transition"
            onClick={() => onOpen?.(task)}
            aria-label="Open"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          {due && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full',
                overdue
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-black/5 dark:bg-white/10'
              )}
            >
              <CalendarDays className="h-3 w-3" /> {dueText}
            </span>
          )}
          {task.role && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${task.role.color}22`,
                color: task.role.color,
              }}
              title="Role"
            >
              {task.role.name}
            </span>
          )}
          {hasSubs && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
              <Clock className="h-3 w-3" /> {subDone}/{subTotal}
            </span>
          )}
        </div>
      </div>

      {/* quick actions */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <IconBtn label="Complete" onClick={() => onComplete?.(task.id)}>
          <CheckCircle2 className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Snooze +1d" onClick={() => onSnooze?.(task.id, 1)}>
          <AlarmClock className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Delete" onClick={() => onDelete?.(task.id)}>
          <Trash2 className="h-4 w-4" />
        </IconBtn>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="h-8 w-8 rounded-md border border-white/50 bg-white/60 hover:bg-white/80 backdrop-blur flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function priorityGradient(p: 1 | 2 | 3 | 4) {
  // Low → Urgent
  const map: Record<1 | 2 | 3 | 4, string> = {
    1: 'linear-gradient(180deg,#9CA3AF 0%,#6B7280 100%)',
    2: 'linear-gradient(180deg,#60A5FA 0%,#3B82F6 100%)',
    3: 'linear-gradient(180deg,#F59E0B 0%,#F97316 100%)',
    4: 'linear-gradient(180deg,#F43F5E 0%,#EF4444 100%)',
  };
  return map[p];
}

function dueBadge(due: Date | null) {
  if (!due) return { badge: null, dueText: '', overdue: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((+d - +today) / 86400000);
  const overdue = diff < 0;

  const dueText =
    diff === 0
      ? 'Today'
      : diff === 1
        ? 'Tomorrow'
        : diff > 1
          ? `In ${diff}d`
          : `${Math.abs(diff)}d late`;
  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px]',
        overdue ? 'bg-red-500/15 text-red-600' : 'bg-black/5 dark:bg-white/10'
      )}
    >
      <CalendarDays className="h-3 w-3" />
      {dueText}
    </span>
  );
  return { badge: chip, dueText, overdue };
}
