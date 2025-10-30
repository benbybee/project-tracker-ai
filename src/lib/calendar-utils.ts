/**
 * Calendar Utilities
 * Helper functions for calendar calculations, date manipulation, and scheduling
 */

export type CalendarView = 'month' | 'week' | 'day' | 'year';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: string;
  projectId?: string;
  projectName?: string;
  status?: string;
  priority?: number;
}

/**
 * Get all days in a month (including overflow from prev/next months for grid)
 */
export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const days: Date[] = [];

  // Previous month overflow
  if (startDay > 0) {
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  // Next month overflow (to fill 6 weeks = 42 days)
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(year, month + 1, day));
  }

  return days;
}

/**
 * Get all days in a week (Sunday to Saturday)
 */
export function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day; // Sunday of current week

  const sunday = new Date(date);
  sunday.setDate(diff);
  sunday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const weekDay = new Date(sunday);
    weekDay.setDate(sunday.getDate() + i);
    days.push(weekDay);
  }

  return days;
}

/**
 * Get time slots for day/week view (24 hours in 30-min increments)
 */
export function getTimeSlots(interval: number = 30): string[] {
  const slots: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }

  return slots;
}

/**
 * Get all months in a year for year view
 */
export function getYearMonths(year: number): Date[] {
  const months: Date[] = [];
  for (let month = 0; month < 12; month++) {
    months.push(new Date(year, month, 1));
  }
  return months;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is in the current month
 */
export function isCurrentMonth(date: Date, currentMonth: number): boolean {
  return date.getMonth() === currentMonth;
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { month: 'short', day: 'numeric' }
      : format === 'long'
        ? { month: 'long', day: 'numeric', year: 'numeric' }
        : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get events for a specific day
 */
export function getEventsForDay(
  events: CalendarEvent[],
  date: Date
): CalendarEvent[] {
  return events.filter((event) => isSameDay(event.start, date));
}

/**
 * Get events for a date range
 */
export function getEventsForRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = event.start.getTime();
    const rangeStart = startDate.getTime();
    const rangeEnd = endDate.getTime();
    return eventStart >= rangeStart && eventStart <= rangeEnd;
  });
}

/**
 * Detect time conflicts between events
 */
export function hasTimeConflict(
  event1: CalendarEvent,
  event2: CalendarEvent
): boolean {
  if (event1.allDay || event2.allDay) return false;

  const start1 = event1.start.getTime();
  const end1 = event1.end ? event1.end.getTime() : start1 + 3600000; // +1 hour default
  const start2 = event2.start.getTime();
  const end2 = event2.end ? event2.end.getTime() : start2 + 3600000;

  return start1 < end2 && end1 > start2;
}

/**
 * Find all conflicts for a given event
 */
export function findConflicts(
  event: CalendarEvent,
  allEvents: CalendarEvent[]
): CalendarEvent[] {
  return allEvents.filter(
    (other) => other.id !== event.id && hasTimeConflict(event, other)
  );
}

/**
 * Get color for event based on priority or project
 */
export function getEventColor(event: CalendarEvent): string {
  if (event.color) return event.color;

  // Priority-based colors
  if (event.priority) {
    const priorityColors: Record<number, string> = {
      1: '#9CA3AF', // Gray - Low
      2: '#3B82F6', // Blue - Medium
      3: '#F97316', // Orange - High
      4: '#EF4444', // Red - Critical
    };
    return priorityColors[event.priority] || '#6B7280';
  }

  return '#6B7280'; // Default gray
}

/**
 * Calculate duration in hours
 */
export function getDurationHours(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return ms / (1000 * 60 * 60);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get week number of the year
 */
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months[month];
}

/**
 * Get day name
 */
export function getDayName(day: number): string {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[day];
}

/**
 * Get short day name
 */
export function getShortDayName(day: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day];
}
