'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDateLabel, getFinancialMonthLabel, getFinancialMonthRange } from '@/lib/utils/getFinancialMonth';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { sanitizeText, validateAmount } from '@/lib/utils/validation';
import { trackEvent, METRICS } from '@/lib/utils/analytics';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';
import type { Category, Transaction, User } from '@/types';
import LucideIcon from '@/components/ui/LucideIcon';

interface EditForm {
  amount: string;
  merchant_name: string;
  date: string;
  category_id: string;
}

interface FormErrors {
  amount?: string;
  date?: string;
  category_id?: string;
}

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get('month');
  const rawCategoryFilter = searchParams.get('category');
  // Only pass category filter if it looks like a valid UUID (prevents malformed query params)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const categoryFilter = rawCategoryFilter && UUID_RE.test(rawCategoryFilter) ? rawCategoryFilter : null;
  const parsedMonth = monthParam ? new Date(monthParam) : undefined;
  const referenceDate = parsedMonth && !Number.isNaN(parsedMonth.getTime()) ? parsedMonth : undefined;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ amount: '', merchant_name: '', date: '', category_id: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); return; }

    const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
    if (!profile) { setLoading(false); return; }

    setUser(profile);
    const { start, end } = getFinancialMonthRange(profile.financial_month_start_day, referenceDate);

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', authUser.id)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);

    if (categoryFilter) query = query.eq('category_id', categoryFilter);

    const [txResult, catResult] = await Promise.all([
      query,
      supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${authUser.id},user_id.is.null`)
        .order('sort_order', { ascending: true }),
    ]);

    setTransactions((txResult.data || []) as Transaction[]);
    setCategories((catResult.data || []) as Category[]);
    setLoading(false);
  }, [categoryFilter, referenceDate]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchTransactions();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fetchTransactions]);

  const openDetail = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditMode(false);
    setFormErrors({});
    setShowDelete(false);
  };

  const openEdit = () => {
    if (!selectedTx) return;
    setEditForm({
      amount: String(Math.abs(selectedTx.amount)),
      merchant_name: selectedTx.merchant_name || '',
      date: selectedTx.date,
      category_id: selectedTx.category_id,
    });
    setFormErrors({});
    setEditMode(true);
    setShowDelete(false);
  };

  const validateEditForm = (): boolean => {
    const errors: FormErrors = {};
    const parsed = Number(editForm.amount);
    
    if (!editForm.amount || isNaN(parsed) || parsed <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!editForm.date) {
      errors.date = 'Date is required';
    }

    if (!editForm.category_id) {
      errors.category_id = 'Category is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!selectedTx) return;
    if (!validateEditForm()) return;

    setSaving(true);
    const parsedAmount = validateAmount(editForm.amount) || 0;
    const sanitizedMerchant = sanitizeText(editForm.merchant_name, 100);
    
    const supabase = createClient();
    const result = await supabase
      .from('transactions')
      .update({
        amount: selectedTx.type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount),
        merchant_name: sanitizedMerchant || null,
        date: editForm.date,
        category_id: editForm.category_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTx.id);
    
    setSaving(false);
    if (result.error) {
      setFormErrors({ amount: result.error.message });
      return;
    }
    
    setSelectedTx(null);
    setEditMode(false);
    void fetchTransactions();
  };

  const handleDelete = async () => {
    if (!selectedTx) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', selectedTx.id);
    setDeleting(false);
    if (error) {
      setFormErrors({ amount: error.message });
      return;
    }
    setSelectedTx(null);
    setShowDelete(false);
    trackEvent(METRICS.TRANSACTION_DELETED);
    void fetchTransactions();
  };

  const grouped = useMemo(() => {
    return transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
      const key = tx.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(tx);
      return acc;
    }, {});
  }, [transactions]);

  const currency = user?.primary_currency || 'AED';
  const categoryName = categories.find(c => c.id === categoryFilter)?.name;
  const monthLabel = user ? getFinancialMonthLabel(user.financial_month_start_day, referenceDate) : 'This Month';

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-8 rounded-xl bg-slate-200 animate-pulse dark:bg-white/5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse dark:bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="relative px-5 pb-32 pt-[var(--pt-safe)]">
      <div className="top-glow" />
      <h1 className="relative z-10 mb-1 text-2xl font-extrabold text-slate-900 dark:text-white">Transactions</h1>
      <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{monthLabel}</p>
      {categoryFilter && categoryName ? (
        <p className="mt-2 mb-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Filtered by {categoryName}
        </p>
      ) : (
        <div className="mb-5" />
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-16">
          <p className="mb-2 text-lg text-slate-600 dark:text-slate-400">No transactions yet</p>
          <p className="text-slate-500 text-sm">Tap + to add your first transaction.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, txns]) => (
            <div key={date}>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.18em] mb-2">
                {formatDateLabel(date)}
              </h3>
              <div className="space-y-2">
                {txns.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => openDetail(tx)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-all active:scale-[0.98] hover:bg-slate-50 dark:border-white/5 dark:bg-slate-800/50 dark:hover:bg-white/10"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem]"
                      style={{ backgroundColor: `${tx.category?.color || '#6366F1'}20`, color: tx.category?.color || '#6366F1' }}
                    >
                      <LucideIcon name={tx.category?.icon || 'CircleDot'} className="w-5 h-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {tx.merchant_name || tx.category?.name || 'Transaction'}
                      </p>
                      {tx.merchant_name && tx.category && (
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider opacity-60 truncate">{tx.category.name}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[15px] font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={!!selectedTx}
        onClose={() => { setSelectedTx(null); setEditMode(false); setFormErrors({}); }}
        title={editMode ? 'Edit Transaction' : 'Transaction Details'}
      >
        {selectedTx && !editMode && (
          <div className="space-y-6">
            <div className="text-center py-2">
              <p className={`text-4xl font-black tracking-tight ${selectedTx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                {selectedTx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(selectedTx.amount), currency)}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">{selectedTx.merchant_name || 'No Description'}</p>
            </div>
            
            <div className="rounded-[1.8rem] bg-slate-50 px-5 py-5 space-y-4 dark:bg-white/5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Category</span>
                <div className="flex items-center gap-2">
                   <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: selectedTx.category?.color }}
                  />
                  <span className="font-bold text-slate-900 dark:text-white">{selectedTx.category?.name}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-200 dark:border-white/5">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatDateLabel(selectedTx.date)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-200 dark:border-white/5">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Reference</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{selectedTx.id.split('-')[0].toUpperCase()}</span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Button fullWidth onClick={openEdit} variant="secondary" className="rounded-3xl py-4 font-bold">
                Edit Transaction
              </Button>

              {!showDelete ? (
                <Button variant="danger" fullWidth onClick={() => setShowDelete(true)} className="rounded-3xl py-4 font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border-transparent">
                  Delete Transaction
                </Button>
              ) : (
                <div className="space-y-3 p-4 rounded-[1.5rem] bg-rose-500/5 border border-rose-500/20">
                  <p className="text-center text-sm font-bold text-rose-500">Confirm Deletion?</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)} className="rounded-2xl py-3 text-sm">Cancel</Button>
                    <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting} className="rounded-2xl py-3 text-sm bg-rose-500 text-white">Delete</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTx && editMode && (
          <div className="space-y-5 pb-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={editForm.amount}
                  onChange={(e) => { setEditForm(f => ({ ...f, amount: e.target.value })); setFormErrors(prev => ({ ...prev, amount: undefined })); }}
                  className={`w-full rounded-[1.5rem] border ${formErrors.amount ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
                  placeholder="0.00"
                />
                {formErrors.amount && <p className="text-rose-500 text-[11px] font-bold mt-1.5 ml-4">{formErrors.amount}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Merchant / Description</label>
              <input
                type="text"
                value={editForm.merchant_name}
                onChange={(e) => setEditForm(f => ({ ...f, merchant_name: e.target.value }))}
                placeholder="Where did you spend?"
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => { setEditForm(f => ({ ...f, date: e.target.value })); setFormErrors(prev => ({ ...prev, date: undefined })); }}
                  className={`w-full rounded-[1.5rem] border ${formErrors.date ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 [color-scheme:light] dark:bg-white/5 dark:text-white dark:[color-scheme:dark] transition-all`}
                />
                {formErrors.date && <p className="text-rose-500 text-[11px] font-bold mt-1.5 ml-4">{formErrors.date}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Category</label>
              <div className={`grid grid-cols-2 gap-2 max-h-52 overflow-y-auto no-scrollbar pr-1 p-2 rounded-[1.5rem] border ${formErrors.category_id ? 'border-rose-500 bg-rose-500/5' : 'border-slate-100 dark:border-white/5'}`}>
                {categories.filter(c => c.type === selectedTx.type).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setEditForm(f => ({ ...f, category_id: cat.id })); setFormErrors(prev => ({ ...prev, category_id: undefined })); }}
                    className={`flex items-center gap-3 rounded-[1.25rem] border px-3 py-3.5 text-left transition-all ${
                      editForm.category_id === cat.id
                        ? 'border-emerald-500 bg-emerald-500/10 active:scale-95 shadow-lg shadow-emerald-500/10'
                        : 'border-transparent bg-white shadow-sm dark:bg-white/5 hover:border-slate-200 dark:hover:border-white/20'
                    }`}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <LucideIcon name={cat.icon} className="h-4 w-4" />
                    </div>
                    <span className={`text-[11px] font-bold truncate ${editForm.category_id === cat.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
              {formErrors.category_id && <p className="text-rose-500 text-[11px] font-bold mt-1.5 ml-4">{formErrors.category_id}</p>}
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="secondary" fullWidth onClick={() => { setEditMode(false); setFormErrors({}); }} className="rounded-3xl py-4 font-bold">
                Cancel
              </Button>
              <Button fullWidth onClick={handleSave} loading={saving} className="rounded-3xl py-4 font-bold bg-emerald-600 text-white dark:bg-emerald-500 border-transparent shadow-lg shadow-emerald-500/20">
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
    </PageTransition>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="p-5 space-y-4">
        <div className="h-8 rounded-xl bg-slate-200 animate-pulse dark:bg-white/5" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-slate-200 animate-pulse dark:bg-white/5" />
        ))}
      </div>
    }>
      <TransactionsPageContent />
    </Suspense>
  );
}
