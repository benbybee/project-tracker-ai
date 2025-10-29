/**
 * Date utility functions for handling dates consistently across the application.
 *
 * Problem: PostgreSQL stores dates as YYYY-MM-DD (date only, no timezone).
 * When JavaScript parses these with `new Date("2025-10-31")`, it interprets
 * them as UTC midnight, which can display as the previous day in local timezones.
 *
 * Solution: Parse date strings as local dates by splitting the string and
 * creating Date objects with local timezone context.
 */

/**
 * Parse a date string (YYYY-MM-DD) as a local date, avoiding timezone issues.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 *
 * @example
 * parseDateAsLocal("2025-10-31") // Returns Oct 31, 2025 in local timezone
 */
export function parseDateAsLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date string as a localized date string.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatDate("2025-10-31") // "10/31/2025"
 * formatDate("2025-10-31", { month: 'short', day: 'numeric' }) // "Oct 31"
 */
export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseDateAsLocal(dateStr);
  return date.toLocaleDateString(undefined, options);
}

/**
 * Get relative date text (Today, Tomorrow, In 3d, 2d late, etc.)
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Object with relative text and overdue flag
 *
 * @example
 * getRelativeDateText("2025-10-31") // { text: "In 2d", overdue: false }
 */
export function getRelativeDateText(dateStr: string): {
  text: string;
  overdue: boolean;
} {
  const date = parseDateAsLocal(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  const overdue = diffDays < 0;

  let text: string;
  if (diffDays === 0) {
    text = 'Today';
  } else if (diffDays === 1) {
    text = 'Tomorrow';
  } else if (diffDays > 1) {
    text = `In ${diffDays}d`;
  } else {
    text = `${Math.abs(diffDays)}d late`;
  }

  return { text, overdue };
}

/**
 * Check if a date is today.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export function isToday(dateStr: string): boolean {
  const date = parseDateAsLocal(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is overdue (before today).
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if the date is before today
 */
export function isOverdue(dateStr: string): boolean {
  const date = parseDateAsLocal(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return targetDate < today;
}

/**
 * Format a date for display in short format (e.g., "Oct 31").
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, { month: 'short', day: 'numeric' });
}

/**
 * Format a date for display in long format (e.g., "October 31, 2025").
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateLong(dateStr: string): string {
  return formatDate(dateStr, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
