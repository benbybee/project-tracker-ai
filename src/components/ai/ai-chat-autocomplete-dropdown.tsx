'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Command, Hash, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutocompleteItem {
  id: string;
  type: 'project' | 'role' | 'command';
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AiChatAutocompleteDropdownProps {
  items: AutocompleteItem[];
  selectedIndex: number;
  onSelect: (item: AutocompleteItem) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  className?: string;
}

export function AiChatAutocompleteDropdown({
  items,
  selectedIndex,
  onSelect,
  onClose,
  position = { top: 0, left: 0 },
  className = '',
}: AiChatAutocompleteDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (items.length === 0) return null;

  // Get icon based on type
  const getIcon = (item: AutocompleteItem) => {
    if (item.icon) return item.icon;

    switch (item.type) {
      case 'project':
        return FolderKanban;
      case 'role':
        return Hash;
      case 'command':
        return Command;
      default:
        return Check;
    }
  };

  // Group items by type
  const groupedItems: { type: string; items: AutocompleteItem[] }[] = [];
  const types = ['project', 'role', 'command'];

  types.forEach((type) => {
    const typeItems = items.filter((item) => item.type === type);
    if (typeItems.length > 0) {
      groupedItems.push({
        type: type.charAt(0).toUpperCase() + type.slice(1) + 's',
        items: typeItems,
      });
    }
  });

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
        }}
        className={cn(
          'z-50 w-80 max-h-64 overflow-y-auto',
          'bg-white dark:bg-slate-800',
          'border border-slate-200 dark:border-slate-700',
          'rounded-lg shadow-lg',
          'py-1',
          className
        )}
      >
        {groupedItems.map((group, groupIndex) => (
          <div key={group.type}>
            {/* Group Header */}
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {group.type}
            </div>

            {/* Group Items */}
            {group.items.map((item, itemIndex) => {
              // Calculate global index
              const globalIndex =
                groupedItems
                  .slice(0, groupIndex)
                  .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;

              const isSelected = globalIndex === selectedIndex;
              const Icon = getIcon(item);

              return (
                <button
                  key={item.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => onSelect(item)}
                  className={cn(
                    'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
                    'focus:outline-none',
                    isSelected
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 mt-0.5 flex-shrink-0',
                      isSelected
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-400 dark:text-slate-500'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-medium truncate',
                        isSelected
                          ? 'text-purple-900 dark:text-purple-100'
                          : 'text-slate-900 dark:text-slate-100'
                      )}
                    >
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Help Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1 px-3 py-1.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
              ↑↓
            </kbd>{' '}
            to navigate,{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
              Enter
            </kbd>{' '}
            to select,{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
              Esc
            </kbd>{' '}
            to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
