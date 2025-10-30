'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Zap } from 'lucide-react';
import { formatShortcut, getModKey } from '@/lib/keyboard-utils';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const modKey = getModKey();

  const shortcuts: Shortcut[] = useMemo(() => [
    // Global shortcuts
    { keys: [modKey, 'K'], description: 'Open command palette', category: 'Global' },
    { keys: [modKey, 'N'], description: 'Quick create task', category: 'Global' },
    { keys: [modKey, 'Shift', 'P'], description: 'Quick create project', category: 'Global' },
    { keys: [modKey, ','], description: 'Open settings', category: 'Global' },
    { keys: [modKey, 'B'], description: 'Toggle sidebar', category: 'Global' },
    { keys: [modKey, '/'], description: 'Show keyboard shortcuts', category: 'Global' },
    { keys: ['Esc'], description: 'Close modals / Cancel', category: 'Global' },
    
    // Navigation (Vim-style)
    { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
    { keys: ['G', 'B'], description: 'Go to Board', category: 'Navigation' },
    { keys: ['G', 'P'], description: 'Go to Projects', category: 'Navigation' },
    { keys: ['G', 'C'], description: 'Go to Daily (Calendar)', category: 'Navigation' },
    { keys: ['G', 'T'], description: 'Go to Tickets', category: 'Navigation' },
    { keys: ['G', 'S'], description: 'Go to Settings', category: 'Navigation' },
    { keys: ['G', 'N'], description: 'Go to Notes', category: 'Navigation' },
    
    // Task actions (when task is focused)
    { keys: ['E'], description: 'Edit selected task', category: 'Tasks' },
    { keys: ['C'], description: 'Mark task as complete', category: 'Tasks' },
    { keys: ['Del'], description: 'Archive selected task', category: 'Tasks' },
    { keys: ['Enter'], description: 'Open task details', category: 'Tasks' },
    { keys: ['1'], description: 'Set priority to P1 (Highest)', category: 'Tasks' },
    { keys: ['2'], description: 'Set priority to P2 (High)', category: 'Tasks' },
    { keys: ['3'], description: 'Set priority to P3 (Medium)', category: 'Tasks' },
    { keys: ['4'], description: 'Set priority to P4 (Low)', category: 'Tasks' },
    { keys: ['↑', '↓'], description: 'Navigate between tasks', category: 'Tasks' },
    { keys: ['←', '→'], description: 'Navigate between columns', category: 'Tasks' },
  ], [modKey]);

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts;
    
    const query = searchQuery.toLowerCase();
    return shortcuts.filter(s => 
      s.description.toLowerCase().includes(query) ||
      s.keys.some(k => k.toLowerCase().includes(query))
    );
  }, [shortcuts, searchQuery]);

  const categorizedShortcuts = useMemo(() => {
    const categories = new Map<string, Shortcut[]>();
    filteredShortcuts.forEach(shortcut => {
      if (!categories.has(shortcut.category)) {
        categories.set(shortcut.category, []);
      }
      categories.get(shortcut.category)!.push(shortcut);
    });
    return categories;
  }, [filteredShortcuts]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-20 md:left-1/2 md:-translate-x-1/2 md:max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {filteredShortcuts.length} shortcuts available
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {Array.from(categorizedShortcuts.entries()).map(([category, categoryShortcuts]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={`${category}-${index}`}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd
                              key={keyIndex}
                              className={cn(
                                'px-2 py-1 text-xs font-semibold rounded',
                                'bg-slate-200 dark:bg-slate-700',
                                'text-slate-700 dark:text-slate-300',
                                'border border-slate-300 dark:border-slate-600',
                                'shadow-sm'
                              )}
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredShortcuts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">
                    No shortcuts found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                Press <kbd className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">{modKey}</kbd> + <kbd className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">/</kbd> to toggle this menu
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

