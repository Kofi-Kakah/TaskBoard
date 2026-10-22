import { addDays, format, isBefore, startOfDay } from "date-fns";

export type DueDateStatus = "overdue" | "soon" | "normal";

export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function formatDateOnly(value: string): string | null {
  const date = parseDateOnly(value);
  return date ? format(date, "MMM d, yyyy") : null;
}

export function getDueDateStatus(value: string, today = new Date()): DueDateStatus | null {
  const date = parseDateOnly(value);
  if (!date) return null;

  const dueDay = startOfDay(date);
  const todayStart = startOfDay(today);
  if (isBefore(dueDay, todayStart)) return "overdue";
  if (dueDay <= addDays(todayStart, 2)) return "soon";
  return "normal";
}
