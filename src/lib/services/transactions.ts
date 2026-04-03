import { createClient } from '@/lib/supabase/client';
import { invalidateDashboardCache } from '@/lib/utils/dashboardCache';
import { trackEvent, METRICS } from '@/lib/utils/analytics';
import { sanitizeText } from '@/lib/utils/validation';

export interface CreateTransactionParams {
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  merchantName?: string;
  description?: string;
  date: string;
  zakatFitrMeta?: any;
}

export interface UpdateTransactionParams {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  type: 'income' | 'expense';
  merchantName?: string;
  description?: string;
  date: string;
}

export const TransactionService = {
  /**
   * Creates a new transaction and invalidates necessary caches.
   */
  async create(params: CreateTransactionParams) {
    const supabase = createClient();
    const { error } = await supabase.from('transactions').insert({
      user_id: params.userId,
      account_id: params.accountId,
      category_id: params.categoryId,
      amount: params.type === 'expense' ? -Math.abs(params.amount) : Math.abs(params.amount),
      type: params.type,
      merchant_name: params.merchantName ? sanitizeText(params.merchantName, 100) : null,
      description: params.description ? sanitizeText(params.description, 200) : null,
      date: params.date,
      zakat_fitr_meta: params.zakatFitrMeta,
    });

    if (error) throw error;

    invalidateDashboardCache(params.userId);
    trackEvent(METRICS.TRANSACTION_ADDED);
    return { success: true };
  },

  /**
   * Updates an existing transaction and invalidates necessary caches.
   */
  async update(params: UpdateTransactionParams) {
    const supabase = createClient();
    const { error } = await supabase
      .from('transactions')
      .update({
        amount: params.type === 'expense' ? -Math.abs(params.amount) : Math.abs(params.amount),
        merchant_name: params.merchantName ? sanitizeText(params.merchantName, 100) : null,
        description: params.description ? sanitizeText(params.description, 200) : null,
        date: params.date,
        category_id: params.categoryId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', params.userId);

    if (error) throw error;

    invalidateDashboardCache(params.userId);
    trackEvent(METRICS.TRANSACTION_EDITED);
    return { success: true };
  },

  /**
   * Performs a soft-delete on a transaction by setting its `deleted_at` timestamp.
   */
  async softDelete(id: string, userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    invalidateDashboardCache(userId);
    trackEvent(METRICS.TRANSACTION_DELETED);
    return { success: true };
  },
};
