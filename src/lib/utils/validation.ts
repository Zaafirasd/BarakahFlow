// src/lib/utils/validation.ts

/**
 * Strips HTML tags and trims whitespace from a string.
 */
export function sanitizeText(input: string, maxLength: number = 200): string {
  if (!input) return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, ''); // strip HTML tags
}

/**
 * Validates and normalizes an amount.
 * Rounds to 2 decimal places and ensures it's a finite number.
 */
export function validateAmount(amount: unknown): number | null {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  
  if (isNaN(num) || !isFinite(num)) return null;
  if (Math.abs(num) > 999999999) return null; // cap at 1 billion
  
  // Return rounded to 2 decimal places
  return Math.round(num * 100) / 100;
}

/**
 * Basic email validation.
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates that a day is between 0 and 31.
 */
export function validateDay(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 31;
}

/**
 * Validates currency against allowed codes.
 */
export function validateCurrency(currency: string): boolean {
  const allowed = ['AED', 'USD', 'SAR', 'KWD', 'BHD', 'QAR', 'OMR', 'EGP', 'INR', 'PKR', 'GBP', 'EUR'];
  return allowed.includes(currency);
}
