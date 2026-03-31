export function formatCurrency(amount: number, currency: string = 'AED'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const sign = isNegative ? '-' : '';

  // Use symbols for major currencies, default to code for others
  const symbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
  };

  if (symbols[currency]) {
    return `${sign}${symbols[currency]}${formatted}`;
  }

  // AED, SAR, etc. usually follow the amount or precede it
  return `${sign}${formatted} ${currency}`;
}

export function formatCurrencyShort(amount: number, currency: string = 'AED'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const sign = isNegative ? '-' : '';

  let value: string;
  if (absAmount >= 1000000) {
    value = `${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    value = `${(absAmount / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(amount, currency);
  }

  const symbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
  };

  if (symbols[currency]) {
    return `${sign}${symbols[currency]}${value}`;
  }

  return `${sign}${value} ${currency}`;
}
