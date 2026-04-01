import type { Account, Transaction } from '@/types';

export const NISAB_GOLD_GRAMS = 87.48; // Standard 24K gold Nisab
export const FALLBACK_GOLD_PRICE_AED = 286.45;
export const ZAKAT_RATE = 0.025; // 2.5% — update annually if needed
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

export function calculateZakat(
  cashAndBankBalance: number,
  inputs: ZakatInputs,
  goldPrice: number = FALLBACK_GOLD_PRICE_AED
): ZakatCalculationResult {
  const nisab = goldPrice * NISAB_GOLD_GRAMS;
  const cashAndBank = cashAndBankBalance + inputs.cashOnHand;
  const goldAndSilver = inputs.goldValue + inputs.silverValue;
  const investments = inputs.investmentValue + inputs.sukukValue;
  const receivables = inputs.loansGiven + inputs.otherReceivables;
  const totalAssets = cashAndBank + goldAndSilver + investments + receivables;
  const deductions = inputs.debtsDue + inputs.essentialExpenses;
  const netZakatable = totalAssets - deductions;
  const aboveNisab = netZakatable >= nisab;
  const zakatDue = aboveNisab ? netZakatable * ZAKAT_RATE : 0;

  return {
    totalAssets,
    cashAndBank,
    goldAndSilver,
    investments,
    receivables,
    deductions,
    netZakatable,
    zakatDue,
    aboveNisab,
    nisab,
  };
}
