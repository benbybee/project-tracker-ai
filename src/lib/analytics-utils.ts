/**
 * Analytics Utilities
 * 
 * Helper functions for data aggregation, calculations, and formatting
 * for the analytics dashboard.
 */

import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Predefined date range presets
 */
export const DATE_RANGE_PRESETS: DateRange[] = [
  {
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
    label: 'Today',
  },
  {
    start: startOfDay(subDays(new Date(), 7)),
    end: endOfDay(new Date()),
    label: 'Last 7 Days',
  },
  {
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date()),
    label: 'Last 30 Days',
  },
  {
    start: startOfDay(subDays(new Date(), 90)),
    end: endOfDay(new Date()),
    label: 'Last 90 Days',
  },
  {
    start: startOfDay(subDays(new Date(), 365)),
    end: endOfDay(new Date()),
    label: 'Last Year',
  },
];

/**
 * Calculate moving average for trend analysis
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number = 7
): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(Math.round(avg * 100) / 100);
  }
  
  return result;
}

/**
 * Calculate completion rate percentage
 */
export function calculateCompletionRate(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Calculate project health score (0-100)
 * 
 * Algorithm:
 * - Start with 100 points
 * - Deduct 10 points per overdue task
 * - Deduct 5 points per blocked task
 * - Deduct 20 points if velocity is significantly below target
 */
export function calculateProjectHealth(params: {
  overdueCount: number;
  blockedCount: number;
  completionRate: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
}): {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
} {
  let score = 100;
  const issues: string[] = [];

  // Penalize overdue tasks
  if (params.overdueCount > 0) {
    const penalty = Math.min(params.overdueCount * 10, 40); // Cap at 40 points
    score -= penalty;
    issues.push(`${params.overdueCount} overdue task(s)`);
  }

  // Penalize blocked tasks
  if (params.blockedCount > 0) {
    const penalty = Math.min(params.blockedCount * 5, 20); // Cap at 20 points
    score -= penalty;
    issues.push(`${params.blockedCount} blocked task(s)`);
  }

  // Penalize low completion rate
  if (params.completionRate < 50) {
    score -= 20;
    issues.push(`Low completion rate (${params.completionRate}%)`);
  }

  // Penalize decreasing velocity
  if (params.velocityTrend === 'decreasing') {
    score -= 15;
    issues.push('Velocity is declining');
  }

  // Ensure score stays in 0-100 range
  score = Math.max(0, Math.min(100, score));

  let status: 'healthy' | 'warning' | 'critical';
  if (score >= 70) status = 'healthy';
  else if (score >= 40) status = 'warning';
  else status = 'critical';

  return { score, status, issues };
}

/**
 * Detect at-risk projects based on criteria
 */
export function isProjectAtRisk(params: {
  overduePercentage: number;
  blockedTasksCount: number;
  blockedDaysAvg: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
}): boolean {
  return (
    params.overduePercentage > 20 ||
    (params.blockedTasksCount >= 3 && params.blockedDaysAvg > 5) ||
    params.velocityTrend === 'decreasing'
  );
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Calculate streak from completion dates
 */
export function calculateStreak(completionDates: Date[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates ascending
  const sorted = completionDates
    .map(d => startOfDay(d).getTime())
    .sort((a, b) => a - b);

  // Remove duplicates
  const unique = Array.from(new Set(sorted));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = startOfDay(new Date()).getTime();
  const yesterday = startOfDay(subDays(new Date(), 1)).getTime();

  // Calculate longest streak
  for (let i = 1; i < unique.length; i++) {
    const dayDiff = (unique[i] - unique[i - 1]) / (1000 * 60 * 60 * 24);
    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (must include today or yesterday)
  const mostRecent = unique[unique.length - 1];
  if (mostRecent === today || mostRecent === yesterday) {
    currentStreak = 1;
    for (let i = unique.length - 2; i >= 0; i--) {
      const dayDiff = (unique[i + 1] - unique[i]) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Generate heatmap data for calendar visualization
 */
export function generateHeatmapData(
  dateRange: DateRange,
  completionData: { date: Date; count: number }[]
): { date: string; count: number; level: number }[] {
  const days = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end,
  });

  const dataMap = new Map(
    completionData.map(d => [format(startOfDay(d.date), 'yyyy-MM-dd'), d.count])
  );

  // Calculate levels based on max count (0-4 scale like GitHub)
  const maxCount = Math.max(...completionData.map(d => d.count), 1);

  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = dataMap.get(dateStr) || 0;
    
    let level = 0;
    if (count > 0) {
      if (count >= maxCount * 0.75) level = 4;
      else if (count >= maxCount * 0.5) level = 3;
      else if (count >= maxCount * 0.25) level = 2;
      else level = 1;
    }

    return {
      date: dateStr,
      count,
      level,
    };
  });
}

/**
 * Get health status color
 */
export function getHealthColor(
  status: 'healthy' | 'warning' | 'critical'
): string {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Group data by time period
 */
export function groupByTimePeriod<T extends { date: Date }>(
  data: T[],
  period: 'day' | 'week' | 'month'
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  data.forEach(item => {
    let key: string;
    if (period === 'day') {
      key = format(item.date, 'yyyy-MM-dd');
    } else if (period === 'week') {
      key = format(item.date, 'yyyy-ww');
    } else {
      key = format(item.date, 'yyyy-MM');
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return grouped;
}

