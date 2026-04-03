import type { Account, User, Transaction, Budget, Bill } from '@/types';

export interface DashboardData {
  user: User;
  transactions: Transaction[];
  allTransactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  bills: Bill[];
  goldPrice: number;
  isGoldCached: boolean;
}

interface CacheEntry {
  data: DashboardData;
  ts: number;
}

// Module-level cache keyed by userId
const _dashboardCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Gets cached dashboard data for a specific user if still valid.
 */
export function getCachedDashboardData(userId: string): DashboardData | null {
  const entry = _dashboardCache.get(userId);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

/**
 * Sets dashboard data in cache for a specific user.
 */
export function setCachedDashboardData(userId: string, data: DashboardData): void {
  _dashboardCache.set(userId, {
    data,
    ts: Date.now(),
  });
}

/**
 * Updates a specific field in the cached user data without a full re-fetch.
 */
export function updateCachedUser(userId: string, updatedUser: User): void {
  const entry = _dashboardCache.get(userId);
  if (entry) {
    entry.data.user = updatedUser;
    _dashboardCache.set(userId, entry);
  }
}

/**
 * Invalidates the dashboard cache for a specific user, or all users if no ID is provided.
 */
export function invalidateDashboardCache(userId?: string): void {
  if (userId) {
    _dashboardCache.delete(userId);
  } else {
    _dashboardCache.clear();
  }
}
