import { RRule, Frequency } from 'rrule';

/**
 * Recurrence Parser for RFC 5545 RRULE format
 * Handles parsing, generation, and human-readable descriptions
 */

export type RecurrencePattern =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export type RecurrenceEndType = 'never' | 'after' | 'byDate';

export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ... 6=Sat (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  monthlyType?: 'date' | 'relative'; // e.g., "15th" vs "first Monday"
  relativeDayOfWeek?: number; // For relative monthly (0-6)
  relativeWeekOfMonth?: number; // 1=first, 2=second, 3=third, 4=fourth, -1=last
  skipWeekends?: boolean;
  endType: RecurrenceEndType;
  occurrenceCount?: number; // For "after X occurrences"
  endDate?: Date; // For "by date"
}

/**
 * Convert RecurrenceConfig to RRULE string
 */
export function configToRRule(
  config: RecurrenceConfig,
  startDate: Date
): string {
  const options: any = {
    dtstart: startDate,
  };

  // Set frequency
  switch (config.pattern) {
    case 'daily':
      options.freq = Frequency.DAILY;
      break;
    case 'weekly':
      options.freq = Frequency.WEEKLY;
      break;
    case 'monthly':
      options.freq = Frequency.MONTHLY;
      break;
    case 'yearly':
      options.freq = Frequency.YEARLY;
      break;
    case 'custom':
      options.freq = Frequency.DAILY; // Default to daily for custom
      break;
  }

  // Set interval
  if (config.interval > 1) {
    options.interval = config.interval;
  }

  // Weekly: specific days of week
  if (
    config.pattern === 'weekly' &&
    config.daysOfWeek &&
    config.daysOfWeek.length > 0
  ) {
    options.byweekday = config.daysOfWeek.map((day) => {
      // Convert 0-6 (Sun-Sat) to RRule weekday constants
      const weekdays = [
        RRule.SU,
        RRule.MO,
        RRule.TU,
        RRule.WE,
        RRule.TH,
        RRule.FR,
        RRule.SA,
      ];
      return weekdays[day];
    });
  }

  // Monthly: specific date or relative
  if (config.pattern === 'monthly') {
    if (config.monthlyType === 'date' && config.dayOfMonth) {
      options.bymonthday = config.dayOfMonth;
    } else if (
      config.monthlyType === 'relative' &&
      config.relativeDayOfWeek !== undefined
    ) {
      const weekdays = [
        RRule.SU,
        RRule.MO,
        RRule.TU,
        RRule.WE,
        RRule.TH,
        RRule.FR,
        RRule.SA,
      ];
      const weekday = weekdays[config.relativeDayOfWeek];

      if (config.relativeWeekOfMonth !== undefined) {
        // Use nth method: weekday.nth(n) where n is the week number
        if (config.relativeWeekOfMonth === -1) {
          options.byweekday = [weekday.nth(-1)]; // Last occurrence
        } else {
          options.byweekday = [weekday.nth(config.relativeWeekOfMonth)];
        }
      }
    }
  }

  // Skip weekends (exclude Saturday and Sunday)
  if (config.skipWeekends) {
    options.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
  }

  // End conditions
  switch (config.endType) {
    case 'never':
      // No end date or count
      break;
    case 'after':
      if (config.occurrenceCount) {
        options.count = config.occurrenceCount;
      }
      break;
    case 'byDate':
      if (config.endDate) {
        options.until = config.endDate;
      }
      break;
  }

  const rule = new RRule(options);
  return rule.toString();
}

/**
 * Parse RRULE string to RecurrenceConfig
 */
export function rruleToConfig(rruleString: string): RecurrenceConfig | null {
  try {
    const rule = RRule.fromString(rruleString);
    const options = rule.options;

    const config: RecurrenceConfig = {
      pattern: 'daily',
      interval: options.interval || 1,
      endType: 'never',
    };

    // Determine pattern from frequency
    switch (options.freq) {
      case Frequency.DAILY:
        config.pattern = 'daily';
        break;
      case Frequency.WEEKLY:
        config.pattern = 'weekly';
        break;
      case Frequency.MONTHLY:
        config.pattern = 'monthly';
        break;
      case Frequency.YEARLY:
        config.pattern = 'yearly';
        break;
    }

    // Extract days of week (for weekly)
    if (options.byweekday && Array.isArray(options.byweekday)) {
      config.daysOfWeek = options.byweekday.map((wd: any) => {
        if (typeof wd === 'number') return wd;
        if (wd.weekday !== undefined) return wd.weekday;
        return 0;
      });
    }

    // Extract end conditions
    if (options.count) {
      config.endType = 'after';
      config.occurrenceCount = options.count;
    } else if (options.until) {
      config.endType = 'byDate';
      config.endDate = options.until;
    }

    return config;
  } catch (error) {
    console.error('Failed to parse RRULE:', error);
    return null;
  }
}

/**
 * Get human-readable description of recurrence rule
 */
export function getRecurrenceDescription(config: RecurrenceConfig): string {
  const parts: string[] = [];

  // Frequency and interval
  switch (config.pattern) {
    case 'daily':
      if (config.interval === 1) {
        parts.push('Every day');
      } else {
        parts.push(`Every ${config.interval} days`);
      }
      break;
    case 'weekly':
      if (config.interval === 1) {
        parts.push('Weekly');
      } else {
        parts.push(`Every ${config.interval} weeks`);
      }

      // Add days of week
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = config.daysOfWeek.map((d) => dayNames[d]).join(', ');
        parts.push(`on ${days}`);
      }
      break;
    case 'monthly':
      if (config.monthlyType === 'date' && config.dayOfMonth) {
        parts.push(`Monthly on day ${config.dayOfMonth}`);
      } else if (config.monthlyType === 'relative') {
        const weekNames = ['first', 'second', 'third', 'fourth', 'last'];
        const dayNames = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const week =
          config.relativeWeekOfMonth === -1
            ? 'last'
            : weekNames[config.relativeWeekOfMonth! - 1];
        const day = dayNames[config.relativeDayOfWeek || 0];
        parts.push(`Monthly on the ${week} ${day}`);
      } else {
        parts.push('Monthly');
      }
      break;
    case 'yearly':
      if (config.interval === 1) {
        parts.push('Yearly');
      } else {
        parts.push(`Every ${config.interval} years`);
      }
      break;
  }

  // Skip weekends
  if (config.skipWeekends) {
    parts.push('(skip weekends)');
  }

  // End condition
  switch (config.endType) {
    case 'never':
      // No additional text needed
      break;
    case 'after':
      parts.push(`for ${config.occurrenceCount} occurrences`);
      break;
    case 'byDate':
      if (config.endDate) {
        parts.push(`until ${config.endDate.toLocaleDateString()}`);
      }
      break;
  }

  return parts.join(' ');
}

/**
 * Calculate next occurrence date based on RRULE
 */
export function getNextOccurrence(
  rruleString: string,
  afterDate?: Date
): Date | null {
  try {
    const rule = RRule.fromString(rruleString);
    const after = afterDate || new Date();
    const next = rule.after(after, true); // true = inclusive
    return next;
  } catch (error) {
    console.error('Failed to get next occurrence:', error);
    return null;
  }
}

/**
 * Get all occurrences between two dates
 */
export function getOccurrencesBetween(
  rruleString: string,
  startDate: Date,
  endDate: Date,
  limit?: number
): Date[] {
  try {
    const rule = RRule.fromString(rruleString);
    const occurrences = rule.between(startDate, endDate, true); // true = inclusive

    if (limit) {
      return occurrences.slice(0, limit);
    }

    return occurrences;
  } catch (error) {
    console.error('Failed to get occurrences:', error);
    return [];
  }
}

/**
 * Get next N occurrences starting from a date
 */
export function getNextOccurrences(
  rruleString: string,
  count: number,
  afterDate?: Date
): Date[] {
  try {
    const rule = RRule.fromString(rruleString);
    const after = afterDate || new Date();
    const occurrences = rule.all((date, i) => {
      if (i >= count) return false;
      return date >= after;
    });

    return occurrences.slice(0, count);
  } catch (error) {
    console.error('Failed to get next occurrences:', error);
    return [];
  }
}

/**
 * Check if a date matches a recurrence rule
 */
export function dateMatchesRule(rruleString: string, date: Date): boolean {
  try {
    const rule = RRule.fromString(rruleString);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const occurrences = rule.between(dayStart, dayEnd, true);
    return occurrences.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Create simple recurrence presets
 */
export const RECURRENCE_PRESETS: Record<string, RecurrenceConfig> = {
  daily: {
    pattern: 'daily',
    interval: 1,
    endType: 'never',
  },
  weekdays: {
    pattern: 'weekly',
    interval: 1,
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    skipWeekends: true,
    endType: 'never',
  },
  weekly: {
    pattern: 'weekly',
    interval: 1,
    endType: 'never',
  },
  biweekly: {
    pattern: 'weekly',
    interval: 2,
    endType: 'never',
  },
  monthly: {
    pattern: 'monthly',
    interval: 1,
    dayOfMonth: 1,
    monthlyType: 'date',
    endType: 'never',
  },
  yearly: {
    pattern: 'yearly',
    interval: 1,
    endType: 'never',
  },
};
