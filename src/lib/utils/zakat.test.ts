import { describe, it, expect } from 'vitest';
import { getNextAnniversary, isHaulComplete } from './zakat';

describe('Zakat Anniversary Logic', () => {
  // Mocking reference date to 2025-04-03
  const referenceDate = new Date('2025-04-03T12:00:00Z');

  describe('getNextAnniversary', () => {
    it('calculates 0 days remaining if anniversary is today', () => {
      const result = getNextAnniversary('2024-04-03', referenceDate);
      expect(result?.daysUntil).toBe(0);
    });

    it('calculates days remaining if anniversary is in the future', () => {
      const result = getNextAnniversary('2024-04-10', referenceDate);
      expect(result?.daysUntil).toBe(7);
    });

    it('calculates days remaining for anniversary next year if passed this year', () => {
      const result = getNextAnniversary('2024-03-01', referenceDate);
      // It should look for the anniversary on March 1st, 2026.
      expect(result?.daysUntil).toBeGreaterThan(300);
      expect(result?.date.getFullYear()).toBe(2026);
    });
  });

  describe('isHaulComplete', () => {
    it('returns true if anniversary is today', () => {
      const result = isHaulComplete('2024-04-03', referenceDate);
      expect(result).toBe(true);
    });

    it('returns true if anniversary was months ago in the current year', () => {
      const result = isHaulComplete('2024-01-01', referenceDate);
      expect(result).toBe(true);
    });

    it('returns false if anniversary is yet to come this year', () => {
      const result = isHaulComplete('2024-05-01', referenceDate);
      expect(result).toBe(false);
    });

    it('returns false if no anniversary date is provided', () => {
      const result = isHaulComplete(null, referenceDate);
      expect(result).toBe(false);
    });
  });
});
