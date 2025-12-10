'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateSprintEndDate, formatDateForSQL } from '@/lib/pattern4-utils';

interface SprintFormProps {
  defaultValues?: {
    name?: string;
    startDate?: string;
    endDate?: string;
    goalSummary?: string;
  };
  onSubmit: (data: {
    name: string;
    startDate: string;
    endDate: string;
    goalSummary?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}

export function SprintForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Create Sprint',
  className,
}: SprintFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(defaultValues?.name || '');
  const [startDate, setStartDate] = useState(defaultValues?.startDate || '');
  const [endDate, setEndDate] = useState(defaultValues?.endDate || '');
  const [goalSummary, setGoalSummary] = useState(
    defaultValues?.goalSummary || ''
  );

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    // Auto-calculate end date (90 days later)
    if (value) {
      const start = new Date(value);
      const end = calculateSprintEndDate(start);
      setEndDate(formatDateForSQL(end));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name, startDate, endDate, goalSummary });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Sprint Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Q1 2024 Growth Sprint"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-foreground mb-2"
          >
            End Date * (90 days)
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            readOnly
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="goalSummary"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Goal Summary
        </label>
        <textarea
          id="goalSummary"
          value={goalSummary}
          onChange={(e) => setGoalSummary(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="What are the main goals for this sprint?"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !name || !startDate || !endDate}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
