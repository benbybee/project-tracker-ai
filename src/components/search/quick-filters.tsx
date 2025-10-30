'use client';

/**
 * Quick Filters Component
 * Smart views for quick filtering (My Focus, Overdue, etc.)
 */

import { useState } from 'react';
import {
  Target,
  AlertCircle,
  Calendar,
  CalendarDays,
  Ban,
  HelpCircle,
  Zap,
  ChevronDown,
} from 'lucide-react';
import {
  SMART_VIEWS,
  type SmartViewType,
  type FilterGroup,
} from '@/lib/search-utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface QuickFiltersProps {
  onFilterSelect: (filters: FilterGroup, viewName: string) => void;
  currentView?: SmartViewType | null;
  className?: string;
}

// Icon mapping
const iconMap: Record<string, any> = {
  Target,
  AlertCircle,
  Calendar,
  CalendarDays,
  Ban,
  HelpCircle,
  Zap,
};

export function QuickFilters({
  onFilterSelect,
  currentView,
  className,
}: QuickFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (viewType: SmartViewType) => {
    const view = SMART_VIEWS[viewType];
    onFilterSelect(view.filters, view.name);
    setOpen(false);
  };

  const currentViewData = currentView ? SMART_VIEWS[currentView] : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
            className
          )}
        >
          {currentViewData ? (
            <>
              {iconMap[currentViewData.icon] &&
                React.createElement(iconMap[currentViewData.icon], {
                  className: 'w-4 h-4',
                })}
              <span className="font-medium">{currentViewData.name}</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>Quick Filters</span>
            </>
          )}
          <ChevronDown className="w-4 h-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Smart Views</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(SMART_VIEWS).map(([key, view]) => {
          const Icon = iconMap[view.icon];
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleSelect(key as SmartViewType)}
              className="flex items-start gap-3 py-3"
            >
              {Icon && (
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    view.color || 'bg-gray-100 dark:bg-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{view.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {view.description}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Import React for createElement
import React from 'react';
