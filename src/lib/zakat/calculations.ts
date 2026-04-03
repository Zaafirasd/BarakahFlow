import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, ZAKAT_RATE, type NisabBasis } from './constants';

export interface ZakatInputs {
  cash: number;
  bankBalances: number;
  goldValue: number;
  silverValue: number;
  investmentsValue: number;
  receivablesLikelyToBePaid: number;
  shortTermDebts: number;
  immediateBillsDue: number;
  nisabValue: number;
  nisabBasis: NisabBasis;
  zakatRate?: number;
}

export interface ZakatResult {
  totalAssets: number;
  totalDeductions: number;
  netZakatableWealth: number;
  nisabValue: number;
  nisabBasis: NisabBasis;
  isAboveNisab: boolean;
  zakatDue: number;
}

export function calculateNisab(pricePerGram: number, basis: NisabBasis = 'silver'): number {
  const grams = basis === 'gold' ? GOLD_NISAB_GRAMS : SILVER_NISAB_GRAMS;
  return pricePerGram * grams;
}

export function calculateZakat(inputs: ZakatInputs): ZakatResult {
  const zakatRate = inputs.zakatRate ?? ZAKAT_RATE;
  
  const totalAssets =
    (inputs.cash || 0) +
    (inputs.bankBalances || 0) +
    (inputs.goldValue || 0) +
    (inputs.silverValue || 0) +
    (inputs.investmentsValue || 0) +
    (inputs.receivablesLikelyToBePaid || 0);

  const totalDeductions = (inputs.shortTermDebts || 0) + (inputs.immediateBillsDue || 0);
  
  const netZakatableWealth = Math.max(0, totalAssets - totalDeductions);
  const isAboveNisab = netZakatableWealth >= inputs.nisabValue;

  return {
    totalAssets,
    totalDeductions,
    netZakatableWealth,
    nisabValue: inputs.nisabValue,
    nisabBasis: inputs.nisabBasis,
    isAboveNisab,
    zakatDue: isAboveNisab ? Number((netZakatableWealth * zakatRate).toFixed(2)) : 0,
  };
}
