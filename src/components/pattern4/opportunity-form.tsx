'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpportunityFormData {
  name: string;
  type: 'MAJOR' | 'MICRO';
  lane?: string;
  summary?: string;
  complexity?: string;
  estimatedCost?: string;
  goToMarket?: string;
  details?: string;
  priority?: number;
  notes?: string;
}

interface OpportunityFormProps {
  defaultValues?: Partial<OpportunityFormData>;
  onSubmit: (data: OpportunityFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  className?: string;
}

export function OpportunityForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Create Opportunity',
  className,
}: OpportunityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OpportunityFormData>({
    name: defaultValues?.name || '',
    type: defaultValues?.type || 'MICRO',
    lane: defaultValues?.lane || '',
    summary: defaultValues?.summary || '',
    complexity: defaultValues?.complexity || 'Medium',
    estimatedCost: defaultValues?.estimatedCost || '',
    goToMarket: defaultValues?.goToMarket || '',
    details: defaultValues?.details || '',
    priority: defaultValues?.priority || 3,
    notes: defaultValues?.notes || '',
  });

  const updateField = (field: keyof OpportunityFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Opportunity Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="New Product Launch"
            required
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Type *
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value as 'MAJOR' | 'MICRO')}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="MICRO">Micro</option>
            <option value="MAJOR">Major</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="lane"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Lane
          </label>
          <input
            type="text"
            id="lane"
            value={formData.lane}
            onChange={(e) => updateField('lane', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Marketing, Product, etc."
          />
        </div>

        <div>
          <label
            htmlFor="complexity"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Complexity
          </label>
          <select
            id="complexity"
            value={formData.complexity}
            onChange={(e) => updateField('complexity', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="estimatedCost"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Estimated Cost ($)
          </label>
          <input
            type="number"
            id="estimatedCost"
            value={formData.estimatedCost}
            onChange={(e) => updateField('estimatedCost', e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="5000"
            min="0"
            step="0.01"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="summary"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Summary
          </label>
          <textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Brief description of the opportunity..."
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="goToMarket"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Go-to-Market Strategy
          </label>
          <textarea
            id="goToMarket"
            value={formData.goToMarket}
            onChange={(e) => updateField('goToMarket', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="How will you bring this to market?"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="details"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Details
          </label>
          <textarea
            id="details"
            value={formData.details}
            onChange={(e) => updateField('details', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Detailed description..."
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Additional notes..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !formData.name}
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

