'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string | Date | null; // YYYY-MM-DD format or Date object
  onChange: (date: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * DatePicker Component
 *
 * A reusable date picker that works with YYYY-MM-DD string format OR Date objects.
 * This component ensures:
 * 1. Dates are always output as YYYY-MM-DD format strings
 * 2. No timezone issues (works with local dates)
 * 3. Controlled component pattern
 * 4. Clear visual feedback
 * 5. Ability to clear the date
 * 6. Handles both string and Date object inputs
 */
export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  console.log('📅 DatePicker - Current value:', value, typeof value);

  // Normalize value to string format (YYYY-MM-DD)
  const normalizedValue = value
    ? typeof value === 'string'
      ? value
      : (() => {
          const d = new Date(value);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })()
    : null;

  // Convert string to Date object for calendar
  const dateValue = normalizedValue
    ? (() => {
        const [year, month, day] = normalizedValue.split('-').map(Number);
        return new Date(year, month - 1, day);
      })()
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to YYYY-MM-DD string
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      console.log('📅 DatePicker - Selected date:', dateString);
      onChange(dateString);
    } else {
      console.log('📅 DatePicker - Cleared date');
      onChange(null);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('📅 DatePicker - Clearing date');
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {normalizedValue ? (
            <span className="flex-1">
              {format(
                new Date(normalizedValue + 'T00:00:00'),
                'PPP' // "November 10, 2025"
              )}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          {normalizedValue && !disabled && (
            <X
              className="ml-2 h-4 w-4 hover:bg-gray-200 rounded-full transition-colors"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}