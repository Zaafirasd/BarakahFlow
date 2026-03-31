import type { BillFrequency } from '@/types';

function getResolvedMonthlyDate(year: number, month: number, day: number): Date {
  if (day === 0) {
    return new Date(year, month + 1, 0);
  }

  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export function formatDayLabel(day: number): string {
  return day === 0 ? 'Last day' : `${day}`;
}

export function formatBillFrequency(frequency: BillFrequency): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

function normalizeReferenceDate(referenceDate?: Date | string): Date {
  const date = referenceDate ? new Date(referenceDate) : new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

export function getFinancialMonthRange(startDay: number, referenceDate?: Date | string): { start: Date; end: Date } {
  const reference = normalizeReferenceDate(referenceDate);
  const currentYear = reference.getFullYear();
  const currentMonth = reference.getMonth();
  const currentDay = reference.getDate();

  let start: Date;
  let end: Date;
  const currentMonthStart = getResolvedMonthlyDate(currentYear, currentMonth, startDay);

  if (currentDay >= currentMonthStart.getDate()) {
    // We're in the financial month that started this calendar month
    start = currentMonthStart;
    const nextMonthStart = getResolvedMonthlyDate(currentYear, currentMonth + 1, startDay);
    end = new Date(nextMonthStart);
    end.setDate(nextMonthStart.getDate() - 1);
  } else {
    // We're in the financial month that started last calendar month
    start = getResolvedMonthlyDate(currentYear, currentMonth - 1, startDay);
    end = new Date(currentMonthStart);
    end.setDate(currentMonthStart.getDate() - 1);
  }

  // Set end to end of day
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

export function getFinancialMonthLabel(startDay: number, referenceDate?: Date | string): string {
  const { start } = getFinancialMonthRange(startDay, referenceDate);

  return start.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function calculateNextDueDate(
  dueDay: number,
  frequency: BillFrequency = 'monthly',
  referenceDate?: Date | string
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const intervalMonths = {
    monthly: 1,
    quarterly: 3,
    annual: 12,
  }[frequency];

  if (referenceDate) {
    const baseDate = typeof referenceDate === 'string' ? new Date(referenceDate) : new Date(referenceDate);
    let candidate = getResolvedMonthlyDate(baseDate.getFullYear(), baseDate.getMonth() + intervalMonths, dueDay);

    while (candidate < today) {
      candidate = getResolvedMonthlyDate(candidate.getFullYear(), candidate.getMonth() + intervalMonths, dueDay);
    }

    return candidate;
  }

  let candidate = getResolvedMonthlyDate(today.getFullYear(), today.getMonth(), dueDay);

  if (candidate < today) {
    candidate = getResolvedMonthlyDate(today.getFullYear(), today.getMonth() + intervalMonths, dueDay);
  }

  return candidate;
}

export function daysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
