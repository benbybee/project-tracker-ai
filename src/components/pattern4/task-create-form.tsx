'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TaskCreateFormProps {
  sprintId?: string;
  sprintWeekId?: string;
  opportunityId?: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: string;
    budgetPlanned?: string;
    sprintId?: string;
    sprintWeekId?: string;
    opportunityId?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function TaskCreateForm({
  sprintId,
  sprintWeekId,
  opportunityId,
  onSubmit,
  onCancel,
  className,
}: TaskCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('2'); // Default to Medium
  const [budgetPlanned, setBudgetPlanned] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        priority,
        budgetPlanned: budgetPlanned || undefined,
        sprintId,
        sprintWeekId,
        opportunityId,
      });
      setTitle('');
      setBudgetPlanned('');
      toast({
        title: 'Task created',
        description: 'Task added successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title..."
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1">Low Priority</option>
            <option value="2">Medium Priority</option>
            <option value="3">High Priority</option>
            <option value="4">Urgent</option>
          </select>
        </div>
        <div className="flex-1">
          <input
            type="number"
            value={budgetPlanned}
            onChange={(e) => setBudgetPlanned(e.target.value)}
            placeholder="Budget ($)"
            min="0"
            step="0.01"
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      )}
    </form>
  );
}

