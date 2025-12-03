/**
 * Search & Filter Utilities
 * Helper functions for advanced search, filtering, and saved views
 */

import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  isBefore,
  isAfter,
  isWithinInterval,
} from 'date-fns';

// Filter operator types
export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'in'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'between'
  | 'exists'
  | 'not_exists';
export type BooleanOperator = 'AND' | 'OR' | 'NOT';

// Filter condition structure
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

// Filter group with boolean logic
export interface FilterGroup {
  operator: BooleanOperator;
  conditions: (FilterCondition | FilterGroup)[];
}

// Smart view definitions
export type SmartViewType =
  | 'my_focus'
  | 'overdue'
  | 'this_week'
  | 'next_week'
  | 'blocked'
  | 'no_due_date'
  | 'quick_wins';

export interface SmartView {
  id: SmartViewType;
  name: string;
  description: string;
  icon: string;
  filters: FilterGroup;
  color?: string;
}

// Predefined smart views
export const SMART_VIEWS: Record<SmartViewType, SmartView> = {
  my_focus: {
    id: 'my_focus',
    name: 'My Focus',
    description: 'High priority tasks assigned to me',
    icon: 'Target',
    color: 'bg-purple-500',
    filters: {
      operator: 'AND',
      conditions: [
        { field: 'priority', operator: 'in', value: ['high', 'urgent'] },
        { field: 'status', operator: 'in', value: ['todo', 'in_progress'] },
      ],
    },
  },
  overdue: {
    id: 'overdue',
    name: 'Overdue',
    description: 'Tasks past their due date',
    icon: 'AlertCircle',
    color: 'bg-red-500',
    filters: {
      operator: 'AND',
      conditions: [
        { field: 'dueDate', operator: 'lt', value: 'NOW' },
        { field: 'status', operator: 'in', value: ['todo', 'in_progress'] },
      ],
    },
  },
  this_week: {
    id: 'this_week',
    name: 'This Week',
    description: 'Tasks due this week',
    icon: 'Calendar',
    color: 'bg-blue-500',
    filters: {
      operator: 'AND',
      conditions: [
        {
          field: 'dueDate',
          operator: 'between',
          value: ['START_OF_WEEK', 'END_OF_WEEK'],
        },
        { field: 'status', operator: 'in', value: ['todo', 'in_progress'] },
      ],
    },
  },
  next_week: {
    id: 'next_week',
    name: 'Next Week',
    description: 'Tasks due next week',
    icon: 'CalendarDays',
    color: 'bg-indigo-500',
    filters: {
      operator: 'AND',
      conditions: [
        {
          field: 'dueDate',
          operator: 'between',
          value: ['NEXT_WEEK_START', 'NEXT_WEEK_END'],
        },
      ],
    },
  },
  blocked: {
    id: 'blocked',
    name: 'Blocked',
    description: 'Tasks with blockers',
    icon: 'Ban',
    color: 'bg-orange-500',
    filters: {
      operator: 'AND',
      conditions: [
        { field: 'dependencies', operator: 'exists', value: true },
        { field: 'status', operator: 'in', value: ['todo', 'in_progress'] },
      ],
    },
  },
  no_due_date: {
    id: 'no_due_date',
    name: 'No Due Date',
    description: 'Tasks without a due date',
    icon: 'HelpCircle',
    color: 'bg-gray-500',
    filters: {
      operator: 'AND',
      conditions: [
        { field: 'dueDate', operator: 'not_exists', value: true },
        { field: 'status', operator: 'in', value: ['todo', 'in_progress'] },
      ],
    },
  },
  quick_wins: {
    id: 'quick_wins',
    name: 'Quick Wins',
    description: 'Small tasks for quick completion',
    icon: 'Zap',
    color: 'bg-green-500',
    filters: {
      operator: 'AND',
      conditions: [
        { field: 'priority', operator: 'in', value: ['low', 'medium'] },
        { field: 'estimatedHours', operator: 'lte', value: 2 },
        { field: 'status', operator: 'equals', value: 'todo' },
      ],
    },
  },
};

// Get date range for relative time filters
export function getDateRange(value: string): Date {
  const now = new Date();

  if (value === 'NOW') {
    return now;
  }

  if (value === 'TODAY') {
    return now;
  }

  if (value === 'START_OF_WEEK') {
    return startOfWeek(now, { weekStartsOn: 1 });
  }

  if (value === 'END_OF_WEEK') {
    return endOfWeek(now, { weekStartsOn: 1 });
  }

  if (value === 'NEXT_WEEK_START') {
    return startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
  }

  if (value === 'NEXT_WEEK_END') {
    return endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
  }

  throw new Error(`Unknown date range: ${value}`);
}

// Apply a single filter condition to a task
export function applyCondition(task: any, condition: FilterCondition): boolean {
  const fieldValue = task[condition.field];

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      }
      return false;

    case 'in':
      return (
        Array.isArray(condition.value) && condition.value.includes(fieldValue)
      );

    case 'gt':
      if (condition.field.includes('Date')) {
        const dateValue =
          condition.value === 'NOW'
            ? getDateRange('NOW')
            : new Date(condition.value);
        return fieldValue && isAfter(new Date(fieldValue), dateValue);
      }
      return fieldValue > condition.value;

    case 'lt':
      if (condition.field.includes('Date')) {
        const dateValue =
          condition.value === 'NOW'
            ? getDateRange('NOW')
            : new Date(condition.value);
        return fieldValue && isBefore(new Date(fieldValue), dateValue);
      }
      return fieldValue < condition.value;

    case 'gte':
      if (condition.field.includes('Date')) {
        const dateValue =
          condition.value === 'NOW'
            ? getDateRange('NOW')
            : new Date(condition.value);
        return (
          fieldValue &&
          (isAfter(new Date(fieldValue), dateValue) ||
            new Date(fieldValue).getTime() === dateValue.getTime())
        );
      }
      return fieldValue >= condition.value;

    case 'lte':
      if (condition.field.includes('Date')) {
        const dateValue =
          condition.value === 'NOW'
            ? getDateRange('NOW')
            : new Date(condition.value);
        return (
          fieldValue &&
          (isBefore(new Date(fieldValue), dateValue) ||
            new Date(fieldValue).getTime() === dateValue.getTime())
        );
      }
      return fieldValue <= condition.value;

    case 'between':
      if (condition.field.includes('Date') && Array.isArray(condition.value)) {
        const start =
          typeof condition.value[0] === 'string' &&
          (condition.value[0].startsWith('START_OF_WEEK') ||
            condition.value[0].startsWith('END_OF_WEEK') ||
            condition.value[0].startsWith('NEXT_WEEK'))
            ? getDateRange(condition.value[0])
            : new Date(condition.value[0]);

        const end =
          typeof condition.value[1] === 'string' &&
          (condition.value[1].startsWith('START_OF_WEEK') ||
            condition.value[1].startsWith('END_OF_WEEK') ||
            condition.value[1].startsWith('NEXT_WEEK'))
            ? getDateRange(condition.value[1])
            : new Date(condition.value[1]);

        return (
          fieldValue && isWithinInterval(new Date(fieldValue), { start, end })
        );
      }
      if (Array.isArray(condition.value)) {
        return (
          fieldValue >= condition.value[0] && fieldValue <= condition.value[1]
        );
      }
      return false;

    case 'exists':
      return condition.value ? fieldValue != null : fieldValue == null;

    case 'not_exists':
      return condition.value ? fieldValue == null : fieldValue != null;

    default:
      return false;
  }
}

// Apply a filter group to a task
export function applyFilterGroup(task: any, group: FilterGroup): boolean {
  const results = group.conditions.map((condition) => {
    if ('operator' in condition && 'conditions' in condition) {
      // It's a nested group
      return applyFilterGroup(task, condition as FilterGroup);
    } else {
      // It's a condition
      return applyCondition(task, condition as FilterCondition);
    }
  });

  switch (group.operator) {
    case 'AND':
      return results.every((r) => r);
    case 'OR':
      return results.some((r) => r);
    case 'NOT':
      return !results.every((r) => r);
    default:
      return false;
  }
}

// Filter tasks by a filter group
export function filterTasks(tasks: any[], filters: FilterGroup): any[] {
  return tasks.filter((task) => applyFilterGroup(task, filters));
}

// Fuzzy search match score (0-1, higher is better)
export function fuzzyMatch(query: string, text: string): number {
  query = query.toLowerCase();
  text = text.toLowerCase();

  // Exact match
  if (text === query) return 1.0;

  // Contains match
  if (text.includes(query)) {
    return 0.8 * (query.length / text.length);
  }

  // Character-by-character fuzzy match
  let queryIndex = 0;
  let textIndex = 0;
  let matches = 0;

  while (queryIndex < query.length && textIndex < text.length) {
    if (query[queryIndex] === text[textIndex]) {
      matches++;
      queryIndex++;
    }
    textIndex++;
  }

  if (matches === query.length) {
    return 0.5 * (matches / text.length);
  }

  return 0;
}

// Search tasks with fuzzy matching
export function fuzzySearchTasks(
  tasks: any[],
  query: string,
  threshold: number = 0.3
): any[] {
  if (!query || query.length < 2) return tasks;

  return tasks
    .map((task) => {
      const titleScore = fuzzyMatch(query, task.title || '');
      const descScore = fuzzyMatch(query, task.description || '');
      const score = Math.max(titleScore, descScore * 0.8); // Title more important than description

      return { task, score };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ task }) => task);
}

// Format filter for display
export function formatFilterCondition(condition: FilterCondition): string {
  const operatorLabels: Record<FilterOperator, string> = {
    equals: 'is',
    contains: 'contains',
    in: 'is one of',
    gt: 'is after',
    lt: 'is before',
    gte: 'is on or after',
    lte: 'is on or before',
    between: 'is between',
    exists: 'exists',
    not_exists: 'does not exist',
  };

  const fieldLabels: Record<string, string> = {
    status: 'Status',
    priority: 'Priority',
    assigneeId: 'Assignee',
    roleId: 'Role',
    dueDate: 'Due Date',
    startDate: 'Start Date',
    estimatedHours: 'Estimated Hours',
    title: 'Title',
    description: 'Description',
  };

  const field = fieldLabels[condition.field] || condition.field;
  const operator = operatorLabels[condition.operator] || condition.operator;

  let value = condition.value;
  if (Array.isArray(value)) {
    value = value.join(', ');
  } else if (typeof value === 'boolean') {
    value = value ? 'Yes' : 'No';
  } else if (value === 'NOW' || value === 'TODAY') {
    value = 'today';
  }

  return `${field} ${operator} ${value}`;
}

// Validate filter structure
export function isValidFilter(filter: any): filter is FilterGroup {
  if (!filter || typeof filter !== 'object') return false;
  if (!['AND', 'OR', 'NOT'].includes(filter.operator)) return false;
  if (!Array.isArray(filter.conditions)) return false;

  return filter.conditions.every((condition: any) => {
    if ('operator' in condition && 'conditions' in condition) {
      return isValidFilter(condition);
    }
    return (
      typeof condition === 'object' &&
      'field' in condition &&
      'operator' in condition &&
      'value' in condition
    );
  });
}
