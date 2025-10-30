'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
  placeholder?: string;
  multiline?: boolean;
  autoSave?: boolean;
  debounceMs?: number;
}

export function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
  displayClassName,
  placeholder = 'Enter text...',
  multiline = false,
  autoSave = true,
  debounceMs = 500,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (currentValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    if (currentValue.trim() === '') {
      setCurrentValue(value);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(currentValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setCurrentValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);

    if (autoSave && debounceMs > 0) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        handleSave();
      }, debounceMs);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (autoSave) {
      handleSave();
    } else {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        onDoubleClick={handleDoubleClick}
        className={cn(
          'cursor-text rounded px-2 py-1 -mx-2 -my-1',
          'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
          displayClassName,
          className
        )}
        title="Double-click to edit"
      >
        {value || <span className="text-slate-400">{placeholder}</span>}
      </div>
    );
  }

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={cn('relative inline-block w-full', className)}>
      <InputComponent
        ref={inputRef as any}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn(
          'w-full px-2 py-1 border rounded',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500',
          'bg-white dark:bg-slate-900',
          'text-slate-900 dark:text-slate-100',
          multiline && 'resize-none',
          inputClassName
        )}
        {...(multiline ? { rows: 3 } : {})}
        disabled={isSaving}
      />

      {/* Action buttons (only show when not auto-save) */}
      {!autoSave && (
        <div className="absolute right-0 top-full mt-1 flex gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50"
            title="Save (Enter)"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Saving indicator (for auto-save) */}
      {autoSave && isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        </div>
      )}
    </div>
  );
}
