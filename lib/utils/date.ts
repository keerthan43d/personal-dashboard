import {
  format,
  formatDistanceToNow,
  parseISO,
  differenceInDays,
  isAfter,
  isBefore,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";

export const fmt = {
  /** "Apr 17, 2026" */
  date: (d: string | Date) =>
    format(typeof d === "string" ? parseISO(d) : d, "MMM d, yyyy"),

  /** "Apr 17" */
  short: (d: string | Date) =>
    format(typeof d === "string" ? parseISO(d) : d, "MMM d"),

  /** "2 days ago" / "in 3 days" */
  relative: (d: string | Date) =>
    formatDistanceToNow(typeof d === "string" ? parseISO(d) : d, { addSuffix: true }),

  /** "Mon" */
  weekday: (d: string | Date) =>
    format(typeof d === "string" ? parseISO(d) : d, "EEE"),

  /** "2026-04-17" */
  iso: (d: Date) => format(d, "yyyy-MM-dd"),
};

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date());
}

export function isOverdue(dateStr: string): boolean {
  return isBefore(parseISO(dateStr), new Date());
}

export function isDueSoon(dateStr: string, withinDays = 7): boolean {
  const d = parseISO(dateStr);
  return isAfter(d, new Date()) && daysUntil(dateStr) <= withinDays;
}

/** Returns Mon–Sun for the week containing `date` (default: today) */
export function getWeekDays(date = new Date()): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end:   endOfWeek(date,   { weekStartsOn: 1 }),
  });
}

/** Last N days as "YYYY-MM-DD" strings */
export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return fmt.iso(d);
  });
}
