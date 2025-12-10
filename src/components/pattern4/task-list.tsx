'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, MoreVertical, Calendar, Target, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pattern4-utils';
import { TaskCreateForm } from './task-create-form';
import { TaskBulkActions } from './task-bulk-actions';

interface Task {
  id: string;
  title: string;
  status: string;
  priorityScore?: string | null; // 1-4 as string from DB
  budgetPlanned?: string | null;
  budgetSpent?: string | null;
  sprintWeekId?: string | null;
  opportunityId?: string | null;
}

interface TaskListProps {
  tasks: Task[];
  onTaskCreate: (data: any) => Promise<void>;
  onTaskUpdate: (id: string, data: any) => Promise<void>;
  onTaskDelete: (id: string) => Promise<void>;
  onBulkMove?: (ids: string[], targetId: string) => Promise<void>;
  sprintId?: string;
  sprintWeekId?: string;
  opportunityId?: string;
  className?: string;
}

export function TaskList({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onBulkMove,
  sprintId,
  sprintWeekId,
  opportunityId,
  className,
}: TaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  const handleBulkComplete = async () => {
    await Promise.all(
      Array.from(selectedTasks).map((id) =>
        onTaskUpdate(id, { status: 'completed' })
      )
    );
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedTasks.size} tasks?`)) {
      await Promise.all(Array.from(selectedTasks).map((id) => onTaskDelete(id)));
      clearSelection();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header / Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Tasks</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <TaskCreateForm
            sprintId={sprintId}
            sprintWeekId={sprintWeekId}
            opportunityId={opportunityId}
            onSubmit={async (data) => {
              await onTaskCreate(data);
              setIsCreating(false);
            }}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const isSelected = selectedTasks.has(task.id);
          const isCompleted = task.status === 'completed';

          return (
            <div
              key={task.id}
              className={cn(
                'group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                isSelected
                  ? 'bg-indigo-500/10 border-indigo-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTaskSelection(task.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border',
                    isSelected
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-muted-foreground'
                  )}
                />
              </button>

              {/* Status Toggle */}
              <button
                onClick={() =>
                  onTaskUpdate(task.id, {
                    status: isCompleted ? 'not_started' : 'completed',
                  })
                }
                className="text-muted-foreground hover:text-indigo-400 transition-colors"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isCompleted
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  )}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {task.priorityScore && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded',
                        task.priorityScore === '4'
                          ? 'bg-red-500/20 text-red-300'
                          : task.priorityScore === '3'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-white/10'
                      )}
                    >
                      P{task.priorityScore}
                    </span>
                  )}
                  {task.budgetPlanned && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(task.budgetPlanned)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button className="p-1 hover:bg-white/10 rounded">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && !isCreating && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks found. Add one to get started.
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      <TaskBulkActions
        selectedCount={selectedTasks.size}
        onClearSelection={clearSelection}
        onComplete={handleBulkComplete}
        onDelete={handleBulkDelete}
      />
    </div>
  );
}

