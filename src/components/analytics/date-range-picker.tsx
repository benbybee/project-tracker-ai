'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  DATE_RANGE_PRESETS,
  type DateRange,
} from '@/lib/analytics-utils';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">Date Range:</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {DATE_RANGE_PRESETS.map((preset) => {
          const isActive =
            format(value.start, 'yyyy-MM-dd') ===
              format(preset.start, 'yyyy-MM-dd') &&
            format(value.end, 'yyyy-MM-dd') ===
              format(preset.end, 'yyyy-MM-dd');

          return (
            <button
              key={preset.label}
              onClick={() => onChange(preset)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700'
                }
              `}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom range indicator */}
      {!DATE_RANGE_PRESETS.some(
        (preset) =>
          format(value.start, 'yyyy-MM-dd') ===
            format(preset.start, 'yyyy-MM-dd') &&
          format(value.end, 'yyyy-MM-dd') === format(preset.end, 'yyyy-MM-dd')
      ) && (
        <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium border border-purple-200 dark:border-purple-800">
          {format(value.start, 'MMM d')} - {format(value.end, 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
}

