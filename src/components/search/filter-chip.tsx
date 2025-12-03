'use client';

/**
 * Filter Chip Component
 * Display active filter with remove option
 */

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChipProps {
  label: string;
  value: string;
  onRemove?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  value,
  onRemove,
  className,
}: FilterChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium',
        className
      )}
    >
      <span className="text-xs opacity-75">{label}:</span>
      <span>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-indigo-200 dark:hover:bg-indigo-800/50 rounded p-0.5 transition-colors"
          title="Remove filter"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export interface ActiveFiltersProps {
  filters: Array<{ label: string; value: string; key: string }>;
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Active filters:
      </span>
      {filters.map((filter) => (
        <FilterChip
          key={filter.key}
          label={filter.label}
          value={filter.value}
          onRemove={() => onRemove(filter.key)}
        />
      ))}
      {filters.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
