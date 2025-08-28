/**
 * Date Utilities
 * Common date manipulation and formatting functions
 */

/**
 * Formats a date to ISO string in UTC
 */
export function toISOString(date: Date | string): string {
  return new Date(date).toISOString();
}

/**
 * Gets the start of day (00:00:00.000) for a given date
 */
export function startOfDay(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of day (23:59:59.999) for a given date
 */
export function endOfDay(date: Date | string): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Adds days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds hours to a date
 */
export function addHours(date: Date | string, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Adds minutes to a date
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Subtracts days from a date
 */
export function subtractDays(date: Date | string, days: number): Date {
  return addDays(date, -days);
}

/**
 * Subtracts hours from a date
 */
export function subtractHours(date: Date | string, hours: number): Date {
  return addHours(date, -hours);
}

/**
 * Subtracts minutes from a date
 */
export function subtractMinutes(date: Date | string, minutes: number): Date {
  return addMinutes(date, -minutes);
}

/**
 * Gets the difference between two dates in days
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets the difference between two dates in hours
 */
export function getHoursDifference(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60));
}

/**
 * Gets the difference between two dates in minutes
 */
export function getMinutesDifference(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60));
}

/**
 * Checks if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  return new Date(date) < new Date();
}

/**
 * Checks if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  return new Date(date) > new Date();
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date | string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a date is within a range
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return d >= start && d <= end;
}

/**
 * Gets the start of the current week (Monday)
 */
export function startOfWeek(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const result = new Date(d.setDate(diff));
  return startOfDay(result);
}

/**
 * Gets the end of the current week (Sunday)
 */
export function endOfWeek(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
  const result = new Date(d.setDate(diff));
  return endOfDay(result);
}

/**
 * Gets the start of the current month
 */
export function startOfMonth(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Gets the end of the current month
 */
export function endOfMonth(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Gets the start of the current year
 */
export function startOfYear(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), 0, 1);
}

/**
 * Gets the end of the current year
 */
export function endOfYear(date?: Date | string): Date {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });
    case 'medium':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    default:
      return d.toLocaleDateString();
  }
}

/**
 * Formats a time for display
 */
export function formatTime(date: Date | string, includeSeconds = false): string {
  const d = new Date(date);
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  if (includeSeconds) {
    options.second = '2-digit';
  }
  
  return d.toLocaleTimeString('en-US', options);
}

/**
 * Formats a date and time for display
 */
export function formatDateTime(date: Date | string, dateFormat: 'short' | 'medium' | 'long' = 'medium'): string {
  return `${formatDate(date, dateFormat)} at ${formatTime(date)}`;
}

/**
 * Gets a human-readable relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.abs(now.getTime() - d.getTime()) / 1000;
  const isPastDate = d < now;

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  let value: number;
  let unit: string;

  if (diffInSeconds < minute) {
    return isPastDate ? 'just now' : 'now';
  } else if (diffInSeconds < hour) {
    value = Math.floor(diffInSeconds / minute);
    unit = value === 1 ? 'minute' : 'minutes';
  } else if (diffInSeconds < day) {
    value = Math.floor(diffInSeconds / hour);
    unit = value === 1 ? 'hour' : 'hours';
  } else if (diffInSeconds < week) {
    value = Math.floor(diffInSeconds / day);
    unit = value === 1 ? 'day' : 'days';
  } else if (diffInSeconds < month) {
    value = Math.floor(diffInSeconds / week);
    unit = value === 1 ? 'week' : 'weeks';
  } else if (diffInSeconds < year) {
    value = Math.floor(diffInSeconds / month);
    unit = value === 1 ? 'month' : 'months';
  } else {
    value = Math.floor(diffInSeconds / year);
    unit = value === 1 ? 'year' : 'years';
  }

  return isPastDate ? `${value} ${unit} ago` : `in ${value} ${unit}`;
}

/**
 * Checks if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

/**
 * Converts a date to UTC
 */
export function toUTC(date: Date | string): Date {
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

/**
 * Gets the business days between two dates (excludes weekends)
 */
export function getBusinessDays(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;
  
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Checks if a date falls on a weekend
 */
export function isWeekend(date: Date | string): boolean {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

/**
 * Gets the next business day (skips weekends)
 */
export function getNextBusinessDay(date: Date | string): Date {
  let nextDay = addDays(date, 1);
  
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  
  return nextDay;
}
