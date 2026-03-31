import { calculateNextDueDate } from '@/lib/utils/getFinancialMonth';
import type { Bill, BillFrequency } from '@/types';

export const BILL_PAYMENT_PREFIX = 'barakaflow:bill-payment';

export interface BillPaymentMeta {
  billId: string;
  monthKey: string;
}

export function getMonthKey(date: Date | string = new Date()) {
  const parsed = typeof date === 'string' ? new Date(date) : new Date(date);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function buildBillPaymentDescription(billId: string, paymentDate: string) {
  return `${BILL_PAYMENT_PREFIX}:${billId}:${getMonthKey(paymentDate)}`;
}

export function parseBillPaymentDescription(description: string | null): BillPaymentMeta | null {
  if (!description?.startsWith(`${BILL_PAYMENT_PREFIX}:`)) {
    return null;
  }

  const payload = description.slice(`${BILL_PAYMENT_PREFIX}:`.length);
  const [billId = '', monthKey = ''] = payload.split(':');
  if (!billId || !monthKey) {
    return null;
  }

  return { billId, monthKey };
}

export function isDateInMonth(date: string, referenceDate: Date = new Date()) {
  const parsed = new Date(date);
  return parsed.getFullYear() === referenceDate.getFullYear() && parsed.getMonth() === referenceDate.getMonth();
}

export function getBillIconName(name: string) {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes('dewa')) return 'Zap';
  if (normalized.includes('etisalat') || normalized === 'du' || normalized.includes('wifi') || normalized.includes('internet')) return 'Wifi';
  if (normalized.includes('rent') || normalized.includes('ejari') || normalized.includes('housing')) return 'Home';
  if (normalized.includes('car')) return 'Car';
  if (normalized.includes('health') || normalized.includes('medical') || normalized.includes('insurance')) return 'Heart';

  return 'ReceiptText';
}

export function resolveBillCategoryName(name: string) {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes('dewa') || normalized.includes('etisalat') || normalized === 'du' || normalized.includes('internet')) {
    return 'Utilities';
  }

  if (normalized.includes('rent') || normalized.includes('ejari') || normalized.includes('housing')) {
    return 'Housing';
  }

  if (normalized.includes('car')) {
    return 'Transportation';
  }

  if (normalized.includes('health') || normalized.includes('medical')) {
    return 'Healthcare';
  }

  return 'Miscellaneous';
}

export function advanceBillNextDueDate(bill: Pick<Bill, 'due_day' | 'frequency' | 'next_due_date'>) {
  return calculateNextDueDate(bill.due_day, bill.frequency, bill.next_due_date).toISOString().split('T')[0];
}

export function getBillFrequencyLabel(frequency: BillFrequency) {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

export function getPreviousBillDueDate(bill: Pick<Bill, 'due_day' | 'frequency' | 'next_due_date'>) {
  const nextDueDate = new Date(bill.next_due_date);
  const monthsToSubtract = bill.frequency === 'monthly' ? 1 : bill.frequency === 'quarterly' ? 3 : 12;
  const targetMonth = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() - monthsToSubtract, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  const day = bill.due_day === 0 ? lastDay : Math.min(bill.due_day, lastDay);
  return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day).toISOString().split('T')[0];
}
