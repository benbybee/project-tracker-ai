'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOpportunityStatusColor } from '@/lib/pattern4-utils';

interface TaskCreateFormProps {
  defaultValues?: {
    sprintId?: string;
    sprintWeekId?: string;
    opportunityId?: string;
    priority?: string;
  };
  onSubmit: (data: {
    title: string;
    description?: string;
    status: string;
    priorityScore: string;
    sprintId?: string;
    sprintWeekId?: string;
    opportunityId?: string;
    budgetPlanned?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function TaskCreateForm({
  defaultValues,
  onSubmit,
  onCancel,
  className,
}: TaskCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priorityScore, setPriorityScore] = useState(
    defaultValues?.priority || '2'
  );
  const [budgetPlanned, setBudgetPlanned] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        status: 'not_started',
        priorityScore,
        sprintId: defaultValues?.sprintId,
        sprintWeekId: defaultValues?.sprintWeekId,
        opportunityId: defaultValues?.opportunityId,
        budgetPlanned: budgetPlanned || undefined,
      });
      setTitle('');
      setDescription('');
      setBudgetPlanned('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'space-y-4 p-4 rounded-xl bg-white/5 border border-white/10',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Plus className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-foreground">Add New Task</h3>
      </div>

      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Task title..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <select
            value={priorityScore}
            onChange={(e) => setPriorityScore(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1">Priority 1 (High)</option>
            <option value="2">Priority 2 (Medium)</option>
            <option value="3">Priority 3 (Low)</option>
            <option value="4">Priority 4 (Lowest)</option>
          </select>
        </div>
        <div>
          <input
            type="number"
            value={budgetPlanned}
            onChange={(e) => setBudgetPlanned(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Budget ($)"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Description (optional)..."
        />
      </div>

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg hover:bg-white/10 text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !title}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
          Create Task
        </button>
      </div>
    </form>
  );
}
