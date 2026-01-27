'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Circle,
  MoreHorizontal,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pattern4-utils';
import { format, parseISO } from 'date-fns';
import { TaskCreateForm } from './task-create-form';
import { TaskBulkActions } from './task-bulk-actions';

interface Task {
  id: string;
  title: string;
  status: string;
  priorityScore: string;
  budgetPlanned?: string | null;
  budgetSpent?: string | null;
  dueDate?: string | null;
  sprintWeekId?: string | null;
  opportunityId?: string | null;
}

interface TaskListProps {
  tasks: Task[];
  groupBy?: 'none' | 'week' | 'opportunity';
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onTaskCreate: (data: any) => Promise<void>;
  onTaskDelete: (taskIds: string[]) => Promise<void>;
  context?: {
    sprintId?: string;
    sprintWeekId?: string;
    opportunityId?: string;
  };
  className?: string;
}

export function TaskList({
  tasks,
  groupBy = 'none',
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  context,
  className,
}: TaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const toggleSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleBulkComplete = async () => {
    await Promise.all(
      Array.from(selectedTasks).map((taskId) =>
        onTaskUpdate(taskId, { status: 'completed' })
      )
    );
  };

  const handleBulkDelete = async () => {
    await onTaskDelete(Array.from(selectedTasks));
    setSelectedTasks(new Set());
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const isCompleted = task.status === 'completed';
    const isSelected = selectedTasks.has(task.id);

    return (
      <div
        className={cn(
          'group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/10 transition-all',
          isSelected && 'bg-white/5 border-indigo-500/30'
        )}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(task.id)}
            className="w-4 h-4 rounded border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500/50"
          />
          <button
            onClick={() =>
              onTaskUpdate(task.id, {
                status: isCompleted ? 'not_started' : 'completed',
              })
            }
            className={cn(
              'transition-colors',
              isCompleted ? 'text-green-400' : 'text-gray-400 hover:text-white'
            )}
          >
            {isCompleted ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium truncate transition-colors',
              isCompleted
                ? 'text-muted-foreground line-through'
                : 'text-foreground'
            )}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.budgetPlanned && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(task.budgetPlanned)}
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(parseISO(task.dueDate), 'MMM d')}
              </span>
            )}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium',
                task.priorityScore === '1' && 'bg-red-500/20 text-red-300',
                task.priorityScore === '2' &&
                  'bg-yellow-500/20 text-yellow-300',
                task.priorityScore === '3' && 'bg-blue-500/20 text-blue-300',
                task.priorityScore === '4' && 'bg-gray-500/20 text-gray-300'
              )}
            >
              P{task.priorityScore}
            </span>
          </div>
        </div>

        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Tasks</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {isCreating ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <TaskCreateForm
          onSubmit={async (data) => {
            await onTaskCreate(data);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
          defaultValues={context}
        />
      )}

      {/* Task List */}
      <div className="space-y-1">
        {tasks.length > 0
          ? tasks.map((task) => <TaskItem key={task.id} task={task} />)
          : !isCreating && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks yet.</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm mt-2"
                >
                  Create your first task
                </button>
              </div>
            )}
      </div>

      {/* Bulk Actions */}
      <TaskBulkActions
        selectedCount={selectedTasks.size}
        onClearSelection={() => setSelectedTasks(new Set())}
        onComplete={handleBulkComplete}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}
