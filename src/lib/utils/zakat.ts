import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, ZAKAT_RATE } from '../zakat/constants';
import type { Account, Transaction } from '@/types';

export { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, ZAKAT_RATE };
export const ZAKAT_LOCAL_STORAGE_PREFIX = 'barakahflow:zakat-calculation';

export interface ZakatInputs {
  cashOnHand: number;
  goldValue: number;
  silverValue: number;
  investmentValue: number;
  sukukValue: number;
  loansGiven: number;
  otherReceivables: number;
  debtsDue: number;
  essentialExpenses: number;
}

export interface ZakatCalculationResult {
  totalAssets: number;
  cashAndBank: number;
  goldAndSilver: number;
  investments: number;
  receivables: number;
  deductions: number;
  netZakatable: number;
  zakatDue: number;
  aboveNisab: boolean;
  nisab: number;
}

export function getZakatStorageKey(userId: string) {
  return `${ZAKAT_LOCAL_STORAGE_PREFIX}:${userId}`;
}

export function calculateAccountsTotal(accounts: Account[], transactions: Transaction[]) {
  const openingBalance = accounts.reduce((sum, account) => sum + Number(account.opening_balance || 0), 0);
  const ledgerBalance = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  return openingBalance + ledgerBalance;
}

export function getNextAnniversary(anniversaryDate: string | null, referenceDate: Date = new Date()) {
  if (!anniversaryDate) {
    return null;
  }

  const base = new Date(anniversaryDate);
  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const next = new Date(base);
  next.setFullYear(referenceDate.getFullYear());
  next.setHours(0, 0, 0, 0);

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  if (next < today) {
    next.setFullYear(referenceDate.getFullYear() + 1);
  }

  const diff = next.getTime() - today.getTime();
  return {
    date: next,
    daysUntil: Math.ceil(diff / (1000 * 60 * 60 * 24)),
  };
}

export function isHaulComplete(anniversaryDate: string | null, referenceDate: Date = new Date()): boolean {
  if (!anniversaryDate) return false;
  
  const base = new Date(anniversaryDate);
  if (Number.isNaN(base.getTime())) return false;

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const thisYearAnniversary = new Date(base);
  thisYearAnniversary.setFullYear(today.getFullYear());
  thisYearAnniversary.setHours(0, 0, 0, 0);

  return today >= thisYearAnniversary;
}
