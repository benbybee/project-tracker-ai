/**
 * Pattern 4 Sprint System Utility Functions
 *
 * Helpers for calculating progress, dates, and financial metrics
 */

import { addDays, differenceInDays, startOfWeek, addWeeks } from 'date-fns';

/**
 * Calculate the end date for a 90-day sprint
 */
export function calculateSprintEndDate(startDate: Date): Date {
  return addDays(startDate, 90);
}

/**
 * Generate week date ranges for a sprint (13 weeks, Monday start)
 */
export function generateSprintWeeks(sprintStartDate: Date): Array<{
  weekIndex: number;
  startDate: Date;
  endDate: Date;
}> {
  // Start from the Monday of the sprint start week
  const firstMonday = startOfWeek(sprintStartDate, { weekStartsOn: 1 });

  const weeks = [];
  for (let i = 0; i < 13; i++) {
    const weekStart = addWeeks(firstMonday, i);
    const weekEnd = addDays(weekStart, 6); // Sunday

    weeks.push({
      weekIndex: i + 1,
      startDate: weekStart,
      endDate: weekEnd,
    });
  }

  return weeks;
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Calculate profit from revenue and cost
 */
export function calculateProfit(
  revenue: string | number,
  cost: string | number
): number {
  const revenueNum =
    typeof revenue === 'string' ? parseFloat(revenue) : revenue;
  const costNum = typeof cost === 'string' ? parseFloat(cost) : cost;

  return revenueNum - costNum;
}

/**
 * Format currency (USD)
 */
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Calculate ROI (Return on Investment) percentage
 */
export function calculateROI(
  revenue: string | number,
  cost: string | number
): number {
  const revenueNum =
    typeof revenue === 'string' ? parseFloat(revenue) : revenue;
  const costNum = typeof cost === 'string' ? parseFloat(cost) : cost;

  if (costNum === 0) return 0;

  const roi = ((revenueNum - costNum) / costNum) * 100;
  return Math.round(roi * 100) / 100; // Round to 2 decimal places
}

/**
 * Get sprint status based on dates
 */
export function getSprintStatus(
  startDate: Date,
  endDate: Date,
  isActive: boolean
): 'upcoming' | 'active' | 'completed' {
  const now = new Date();

  if (!isActive) return 'completed';
  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'completed';

  return 'active';
}

/**
 * Get current week number in sprint (1-13)
 */
export function getCurrentSprintWeek(sprintStartDate: Date): number {
  const now = new Date();
  const daysSinceStart = differenceInDays(now, sprintStartDate);
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;

  return Math.min(Math.max(weekNumber, 1), 13);
}

/**
 * Validate sprint dates
 */
export function validateSprintDates(
  startDate: Date,
  endDate: Date
): {
  valid: boolean;
  error?: string;
} {
  const daysDiff = differenceInDays(endDate, startDate);

  if (daysDiff < 0) {
    return { valid: false, error: 'End date must be after start date' };
  }

  if (daysDiff !== 90) {
    return { valid: false, error: 'Sprint must be exactly 90 days' };
  }

  return { valid: true };
}

/**
 * Sum decimal values from string or number array
 */
export function sumDecimalValues(
  values: Array<string | number | null | undefined>
): number {
  return values.reduce((sum, val) => {
    if (!val) return sum;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}

/**
 * Get status badge color
 */
export function getOpportunityStatusColor(
  status: 'IDEA' | 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'KILLED'
): string {
  const colors = {
    IDEA: 'bg-gray-500',
    PLANNING: 'bg-blue-500',
    ACTIVE: 'bg-green-500',
    ON_HOLD: 'bg-yellow-500',
    COMPLETED: 'bg-purple-500',
    KILLED: 'bg-red-500',
  };

  return colors[status] || 'bg-gray-500';
}

/**
 * Get decision badge color
 */
export function getDecisionColor(
  decision: 'KEEP' | 'ADJUST' | 'CANCEL' | 'UNDECIDED'
): string {
  const colors = {
    KEEP: 'bg-green-500',
    ADJUST: 'bg-yellow-500',
    CANCEL: 'bg-red-500',
    UNDECIDED: 'bg-gray-500',
  };

  return colors[decision] || 'bg-gray-500';
}

/**
 * Format date for SQL (YYYY-MM-DD)
 */
export function formatDateForSQL(date: Date): string {
  return date.toISOString().split('T')[0];
}
