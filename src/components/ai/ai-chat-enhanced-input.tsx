'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AiChatAutocompleteDropdown,
  AutocompleteItem,
} from './ai-chat-autocomplete-dropdown';
import {
  useChatAutocompleteData,
  filterAutocompleteItems,
} from '@/hooks/use-chat-autocomplete-data';
import { parseChatTags } from '@/lib/chat-tags-parser';

interface AiChatEnhancedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onParsedDataChange: (parsed: ReturnType<typeof parseChatTags>) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function AiChatEnhancedInput({
  value,
  onChange,
  onSend,
  onParsedDataChange,
  isLoading = false,
  placeholder = 'What can I help you with?',
  className = '',
}: AiChatEnhancedInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteType, setAutocompleteType] = useState<
    'project' | 'role' | 'command'
  >('project');
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const autocompleteData = useChatAutocompleteData();

  // Parse tags whenever value changes
  useEffect(() => {
    const parsed = parseChatTags(value, {
      projects: autocompleteData.projects,
      roles: autocompleteData.roles,
    });
    onParsedDataChange(parsed);
  }, [value, autocompleteData, onParsedDataChange]);

  // Get autocomplete items
  const autocompleteItems = filterAutocompleteItems(
    autocompleteQuery,
    autocompleteType,
    autocompleteData
  );

  // Detect @ or / triggers
  const detectTrigger = useCallback((text: string, cursorPos: number) => {
    if (cursorPos === 0) return null;

    // Find the last @ or / before cursor
    let pos = cursorPos - 1;
    while (pos >= 0 && text[pos] !== '@' && text[pos] !== '/') {
      if (text[pos] === ' ') return null; // Stop at space
      pos--;
    }

    if (pos < 0) return null;

    const trigger = text[pos];
    const query = text.substring(pos + 1, cursorPos);

    if (trigger === '@') {
      return { type: 'project' as const, query, startPos: pos };
    } else if (trigger === '/') {
      return { type: 'command' as const, query, startPos: pos };
    }

    return null;
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(newCursorPos);

    // Check for trigger
    const trigger = detectTrigger(newValue, newCursorPos);

    if (trigger) {
      setShowAutocomplete(true);
      setAutocompleteType(trigger.type);
      setAutocompleteQuery(trigger.query);
      setSelectedIndex(0);
    } else {
      setShowAutocomplete(false);
    }
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (item: AutocompleteItem) => {
    if (!inputRef.current) return;

    const trigger = detectTrigger(value, cursorPosition);
    if (!trigger) return;

    // Replace the trigger and query with the selected item
    const before = value.substring(0, trigger.startPos);
    const after = value.substring(cursorPosition);

    let replacement = '';
    if (item.type === 'project') {
      replacement = `@${item.label} `;
    } else if (item.type === 'command') {
      replacement = `${item.label} `;
    } else if (item.type === 'role') {
      replacement = `${item.label} `;
    }

    const newValue = before + replacement + after;
    onChange(newValue);

    // Set cursor position after replacement
    const newCursorPos = before.length + replacement.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);

    setShowAutocomplete(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < autocompleteItems.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (autocompleteItems[selectedIndex]) {
          handleAutocompleteSelect(autocompleteItems[selectedIndex]);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    } else {
      // Normal enter to send
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    }
  };

  // Calculate dropdown position
  const getDropdownPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };

    const rect = inputRef.current.getBoundingClientRect();
    return {
      top: rect.top - 280, // Show above input (dropdown height)
      left: rect.left,
    };
  };

  // Parse current value to get validation errors
  const parsed = parseChatTags(value, {
    projects: autocompleteData.projects,
    roles: autocompleteData.roles,
  });

  const hasErrors = parsed.hasErrors && value.trim().length > 0;

  return (
    <div className={cn('relative', className)}>
      {/* Error messages */}
      {hasErrors && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-red-700 dark:text-red-300">
              {parsed.errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showAutocomplete && autocompleteItems.length > 0 && (
        <AiChatAutocompleteDropdown
          items={autocompleteItems}
          selectedIndex={selectedIndex}
          onSelect={handleAutocompleteSelect}
          onClose={() => setShowAutocomplete(false)}
          position={getDropdownPosition()}
        />
      )}

      {/* Input container */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!showAutocomplete) {
            onSend();
          }
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'border border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-800',
              'text-slate-900 dark:text-slate-100',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-purple-500',
              'disabled:opacity-50',
              hasErrors &&
                'border-red-300 dark:border-red-700 focus:ring-red-500'
            )}
          />
        </div>

        <button
          type="submit"
          disabled={!value.trim() || isLoading || hasErrors}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-all duration-200',
            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
            'text-white shadow-md hover:shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Tag legend */}
      {value &&
        (parsed.tags.projects.length > 0 ||
          parsed.tags.task ||
          parsed.tags.priority) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {parsed.tags.projects.length > 0 && (
              <div className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                {parsed.tags.projects.length} project
                {parsed.tags.projects.length > 1 ? 's' : ''} tagged
              </div>
            )}
            {parsed.tags.task && (
              <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                Task: {parsed.tags.task}
              </div>
            )}
            {parsed.tags.priority && (
              <div className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded">
                Priority: {parsed.tags.priority}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
