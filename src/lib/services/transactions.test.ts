import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from './transactions';
import * as supabaseClient from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock other utilities
vi.mock('@/lib/utils/dashboardCache', () => ({
  invalidateDashboardCache: vi.fn(),
}));
vi.mock('@/lib/utils/analytics', () => ({
  trackEvent: vi.fn(),
  METRICS: {
    TRANSACTION_ADDED: 'TRANSACTION_ADDED',
    TRANSACTION_EDITED: 'TRANSACTION_EDITED',
    TRANSACTION_DELETED: 'TRANSACTION_DELETED',
  },
}));

describe('Transaction Service', () => {
  const mockEq = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    update: mockUpdate,
    insert: vi.fn().mockReturnThis(),
    eq: mockEq,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseClient.createClient as any).mockReturnValue(mockSupabase);
    // Reset the eq mock to return itself for chaining, but we'll override resolved value in each test
    mockEq.mockReturnThis();
  });

  describe('softDelete', () => {
    it('sets deleted_at to a valid timestamp', async () => {
      // For the final call in the chain, we want to resolve to { error: null }
      // The sequence is .from().update().eq().eq()
      mockEq.mockReturnValueOnce(mockSupabase); // first .eq returns supa
      mockEq.mockResolvedValueOnce({ error: null }); // second .eq resolves

      const result = await TransactionService.softDelete('tx-123', 'user-456');
      
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}/),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'tx-123');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
    });

    it('throws error if supabase update fails', async () => {
      const errorMsg = 'DB Error';
      mockEq.mockReturnValueOnce(mockSupabase);
      mockEq.mockResolvedValueOnce({ error: new Error(errorMsg) });

      await expect(TransactionService.softDelete('tx-123', 'user-456')).rejects.toThrow(errorMsg);
    });
  });

  describe('update', () => {
    it('updates specified fields', async () => {
      mockEq.mockReturnValueOnce(mockSupabase);
      mockEq.mockResolvedValueOnce({ error: null });

      const updates = { 
        id: 'tx-123',
        userId: 'user-456',
        amount: 50.5, 
        description: 'Lunch update',
        type: 'expense' as const,
        date: '2025-04-03',
        categoryId: 'cat-789'
      };
      const result = await TransactionService.update(updates);
      
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        amount: -50.5,
        description: 'Lunch update'
      }));
      expect(mockEq).toHaveBeenCalledWith('id', 'tx-123');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
    });
  });
});
