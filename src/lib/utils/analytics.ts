// src/lib/utils/analytics.ts
import { createClient } from '@/lib/supabase/client';

/**
 * Metric names for anonymous tracking.
 * These describe ACTIONS, not USERS.
 */
export const METRICS = {
  SIGNUP: 'signups',
  SIGNIN: 'signins',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  TRANSACTION_ADDED: 'transactions_added',
  TRANSACTION_DELETED: 'transactions_deleted',
  BILL_ADDED: 'bills_added',
  BILL_DELETED: 'bills_deleted',
  BUDGET_CREATED: 'budgets_created',
  ZAKAT_ENABLED: 'zakat_enabled',
} as const;

/**
 * Tracks an anonymous event by incrementing a daily counter in Supabase.
 * Uses a RPC call to 'increment_metric' function.
 */
export async function trackEvent(metric_name: string) {
  try {
    const supabase = createClient();
    
    // We use RPC so the increment happens server-side with SECURITY DEFINER
    // Regular users have EXECUTE permission but no READ permission on analytics
    const { error } = await supabase.rpc('increment_metric', { 
      metric_name 
    });

    if (error) {
       // Log but don't crash
       console.warn('Analytics sync error:', error.message);
    }
  } catch (err) {
    // Analytics should be silent & non-blocking
    console.error('Analytics tracking failed:', err);
  }
}
