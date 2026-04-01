'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChartPie, Pencil, Target, TriangleAlert } from 'lucide-react';
import BudgetRing, { getBudgetStatusColor } from '@/components/budget/BudgetRing';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import LucideIcon from '@/components/ui/LucideIcon';
import PageTransition from '@/components/ui/PageTransition';
import Toast from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { buildAutoBudgetPlan } from '@/lib/utils/budgeting';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDateLabel, getFinancialMonthLabel, getFinancialMonthRange } from '@/lib/utils/getFinancialMonth';
import type { Budget, Category, Transaction, User } from '@/types';

type BudgetWithCategory = Budget & { category: Category };
type TransactionWithCategory = Transaction & { category: Category };

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000];

interface CategoryBudgetRowProps {
  category: { id: string; name: string; icon: string; color: string };
  value: string;
  onChange: (categoryId: string, value: string) => void;
}

function CategoryBudgetRow({ category, value, onChange }: CategoryBudgetRowProps) {
  const [isFocused, setIsFocused] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const isZeroState = !value || Number(value) === 0;

  const handleFocus = () => {
    setIsFocused(true);
    // Smoothly scroll to the center of the viewport after a tiny delay for mobile keyboard
    setTimeout(() => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div
      ref={rowRef}
      className={`rounded-[1.8rem] border p-4 transition-all duration-300 ${
        isFocused
          ? 'border-emerald-500 bg-emerald-500/[0.02] shadow-[0_8px_30px_rgba(16,185,129,0.08)] ring-4 ring-emerald-500/10'
          : isZeroState
          ? 'border-slate-200/70 bg-slate-50/70 opacity-80 dark:border-white/5 dark:bg-white/5'
          : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          <LucideIcon name={category.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{category.name}</p>
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => onChange(category.id, event.target.value)}
          placeholder="0"
          className="w-24 shrink-0 rounded-[1.2rem] border border-slate-200 bg-white px-3 py-4 text-right text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
        />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={`${category.id}-${amount}`}
            type="button"
            onClick={() => onChange(category.id, String(amount))}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {amount}
          </button>
        ))}
      </div>
    </div>
  );
}

function getReferenceDate(offset: number) {
  const referenceDate = new Date();
  if (offset !== 0) {
    // Set day to 1 before modifying month to avoid rollover on the 31st
    referenceDate.setDate(1);
    referenceDate.setMonth(referenceDate.getMonth() + offset);
  }
  return referenceDate;
}

export default function BudgetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [draftBudgets, setDraftBudgets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' }>({
    message: '',
    tone: 'success',
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const referenceDate = useMemo(() => getReferenceDate(monthOffset), [monthOffset]);
  const isCurrentMonthView = monthOffset === 0;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (toast.message) {
        setToast((current) => ({ ...current, message: '' }));
      }
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [toast.message]);

  const loadBudgetView = useCallback(async () => {
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return;
    }

    // Fetch profile and categories in parallel (don't need profile for these queries)
    const [profileResult, budgetResult, categoryResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase
        .from('budgets')
        .select('*, category:categories(id, name, icon, color, sort_order, is_islamic, type)')
        .eq('user_id', authUser.id)
        .eq('is_active', true),
      supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${authUser.id},user_id.is.null`)
        .eq('type', 'expense')
        .order('sort_order', { ascending: true }),
    ]);

    if (!profileResult.data) {
      setLoading(false);
      return;
    }

    const profile = profileResult.data as User;
    setUser(profile);

    // Now fetch transactions with the financial month range (needs profile)
    const { start, end } = getFinancialMonthRange(profile.financial_month_start_day, referenceDate);

    const transactionResult = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', authUser.id)
      .eq('type', 'expense')
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    setBudgets((budgetResult.data || []).filter((budget): budget is BudgetWithCategory => Boolean(budget.category)));
    setTransactions((transactionResult.data || []).filter((transaction): transaction is TransactionWithCategory => Boolean(transaction.category)));
    setCategories(categoryResult.data || []);
    setLoading(false);
  }, [referenceDate]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadBudgetView();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loadBudgetView]);

  const budgetDrafts = useMemo(
    () =>
      budgets.reduce<Record<string, string>>((acc, budget) => {
        acc[budget.category_id] = String(budget.amount);
        return acc;
      }, {}),
    [budgets]
  );

  const { start, end } = useMemo(
    () => getFinancialMonthRange(user?.financial_month_start_day ?? 1, referenceDate),
    [referenceDate, user?.financial_month_start_day]
  );

  const monthLabel = useMemo(
    () => getFinancialMonthLabel(user?.financial_month_start_day ?? 1, referenceDate),
    [referenceDate, user?.financial_month_start_day]
  );

  const spendingByCategory = useMemo(() => {
    return transactions.reduce<Map<string, { amount: number; transactions: TransactionWithCategory[] }>>((acc, transaction) => {
      const current = acc.get(transaction.category_id) || { amount: 0, transactions: [] };
      current.amount += Math.abs(Number(transaction.amount));
      current.transactions.push(transaction);
      acc.set(transaction.category_id, current);
      return acc;
    }, new Map());
  }, [transactions]);

  const budgetItems = useMemo(() => {
    return budgets
      .map((budget) => {
        const spending = spendingByCategory.get(budget.category_id);
        const spent = spending?.amount || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const remaining = budget.amount - spent;

        return {
          budget,
          transactions: spending?.transactions || [],
          spent,
          percentage,
          remaining,
          overAmount: Math.max(spent - budget.amount, 0),
        };
      })
      .sort((first, second) => first.budget.category.sort_order - second.budget.category.sort_order);
  }, [budgets, spendingByCategory]);

  const totalBudgeted = useMemo(() => budgets.reduce((sum, budget) => sum + Number(budget.amount), 0), [budgets]);
  const totalSpent = useMemo(() => budgetItems.reduce((sum, item) => sum + item.spent, 0), [budgetItems]);
  const remainingTotal = totalBudgeted - totalSpent;
  const usagePercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const daysLeft = Math.max(Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)), 0);
  const paceAmount = remainingTotal > 0 && daysLeft > 0 ? remainingTotal / daysLeft : 0;

  const totalBudgetedDraft = useMemo(
    () =>
      categories.reduce((sum, category) => {
        const amount = Number(draftBudgets[category.id] || 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [categories, draftBudgets]
  );

  const monthlyIncome = Number(user?.monthly_income || 0);
  const unallocatedIncome = monthlyIncome - totalBudgetedDraft;
  const regularCategories = categories.filter((category) => !category.is_islamic);
  const islamicCategories = categories.filter((category) => category.is_islamic);

  const openEditor = () => {
    if (!isCurrentMonthView) return;
    setDraftBudgets(budgetDrafts);
    setShowResetConfirm(false);
    setEditOpen(true);
  };

  const handleSaveBudgets = async () => {
    if (!user) return;

    setSaving(true);
    const supabase = createClient();
    const existingBudgets = new Map(budgets.map((budget) => [budget.category_id, budget]));
    const desiredAmounts = new Map<string, number>();

    categories.forEach((category) => {
      const parsed = Number(draftBudgets[category.id] || 0);
      if (Number.isFinite(parsed) && parsed > 0) {
        desiredAmounts.set(category.id, parsed);
      }
    });

    const toDelete = budgets.filter((budget) => !desiredAmounts.has(budget.category_id)).map((budget) => budget.id);
    const toUpdate = Array.from(desiredAmounts.entries())
      .filter(([categoryId]) => existingBudgets.has(categoryId))
      .map(([categoryId, amount]) => ({ id: existingBudgets.get(categoryId)!.id, amount }));
    const toInsert = Array.from(desiredAmounts.entries())
      .filter(([categoryId]) => !existingBudgets.has(categoryId))
      .map(([categoryId, amount]) => ({ user_id: user.id, category_id: categoryId, amount }));

    if (toDelete.length > 0) {
      const deleteResult = await supabase.from('budgets').delete().in('id', toDelete);
      if (deleteResult.error) {
        setSaving(false);
        setToast({ message: deleteResult.error.message, tone: 'error' });
        return;
      }
    }

    if (toUpdate.length > 0) {
      const updateResults = await Promise.all(
        toUpdate.map((budget) => supabase.from('budgets').update({ amount: budget.amount, is_active: true }).eq('id', budget.id))
      );

      const firstError = updateResults.find((result) => result.error)?.error;
      if (firstError) {
        setSaving(false);
        setToast({ message: firstError.message, tone: 'error' });
        return;
      }
    }

    if (toInsert.length > 0) {
      const insertResult = await supabase.from('budgets').insert(toInsert);
      if (insertResult.error) {
        setSaving(false);
        setToast({ message: insertResult.error.message, tone: 'error' });
        return;
      }
    }

    setSaving(false);
    setEditOpen(false);
    setToast({ message: 'Budgets updated', tone: 'success' });
    await loadBudgetView();
  };

  const applyAutoBudgetDraft = () => {
    if (!monthlyIncome) {
      setToast({ message: 'Add your monthly income in Profile first', tone: 'error' });
      return;
    }

    const autoPlan = buildAutoBudgetPlan(categories, monthlyIncome);
    const nextDrafts = autoPlan.reduce<Record<string, string>>((acc, item) => {
      acc[item.categoryId] = item.amount.toFixed(2);
      return acc;
    }, {});

    setDraftBudgets(nextDrafts);
    setShowResetConfirm(false);
    setToast({ message: 'Recommended split loaded', tone: 'success' });
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-12 w-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
        <div className="h-64 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
        <div className="h-32 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
        <div className="h-32 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div
        className="min-h-screen px-5 pb-32 pt-4"
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const delta = event.changedTouches[0].clientX - touchStartX.current;
          if (delta <= -60) setMonthOffset((current) => current - 1);
          if (delta >= 60) setMonthOffset((current) => Math.min(current + 1, 0));
          touchStartX.current = null;
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonthOffset((current) => current - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-slate-900 shadow-sm backdrop-blur-xl transition active:scale-95 dark:border-white/10 dark:bg-slate-900/76 dark:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{monthLabel}</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>

          <button
            type="button"
            disabled={isCurrentMonthView}
            onClick={() => setMonthOffset((current) => Math.min(current + 1, 0))}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-slate-900 shadow-sm backdrop-blur-xl transition enabled:active:scale-95 disabled:opacity-30 dark:border-white/10 dark:bg-slate-900/76 dark:text-white"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/82 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-3xl dark:border-white/10 dark:bg-slate-900/76"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">
              Monthly Performance
            </div>
            <Target className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="mt-8 flex flex-col items-center">
            <BudgetRing percentage={usagePercentage} size={200} strokeWidth={14} topLabel="Used" bottomLabel="budget" />

            <div className="mt-8 grid w-full grid-cols-3 gap-2">
              {[
                { label: 'Budgeted', value: totalBudgeted, color: 'text-slate-900 dark:text-white' },
                { label: 'Spent', value: totalSpent, color: 'text-slate-900 dark:text-white' },
                { label: 'Remaining', value: Math.max(remainingTotal, 0), color: remainingTotal < 0 ? 'text-rose-500' : 'text-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] bg-slate-50/90 px-2 py-3 text-center dark:bg-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 leading-tight">{item.label}</p>
                  <p className={`mt-1.5 text-sm font-extrabold leading-tight tabular-nums ${item.color}`}>{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono">{user?.primary_currency || 'AED'}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 w-full rounded-[1.6rem] bg-slate-50 px-4 py-4 text-center dark:bg-white/5">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {remainingTotal >= 0
                  ? `You can spend about ${formatCurrency(paceAmount, user?.primary_currency || 'AED')} per day for the rest of this month.`
                  : `You are over budget by ${formatCurrency(Math.abs(remainingTotal), user?.primary_currency || 'AED')}.`}
              </p>
            </div>
          </div>
        </motion.div>

        {budgetItems.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300/70 bg-white/76 px-6 py-14 text-center dark:border-white/10 dark:bg-slate-900/76">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.8rem] bg-emerald-500/10 text-emerald-500">
              <ChartPie className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Start Budgeting</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Set monthly category targets so your spending stays intentional.</p>
            <div className="mt-8">
              <Button 
                onClick={() => isCurrentMonthView ? openEditor() : setMonthOffset(0)} 
                className="rounded-3xl px-6 py-4 text-base font-bold"
              >
                {isCurrentMonthView ? 'Edit Budgets' : 'Switch to Current Month'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/82 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76">
            {budgetItems.map((item, index) => {
              const isExpanded = expandedCategoryId === item.budget.category_id;
              const progressWidth = Math.min(item.percentage, 100);
              const barColor = getBudgetStatusColor(item.percentage);

              return (
                <div key={item.budget.id}>
                  {index > 0 && <div className="mx-6 border-t border-slate-100/60 dark:border-white/5" />}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedCategoryId((current) => (current === item.budget.category_id ? null : item.budget.category_id))}
                      className="w-full px-6 py-5 text-left transition-colors active:bg-slate-50/50 dark:active:bg-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: `${item.budget.category.color}15`, color: item.budget.category.color }}
                        >
                          <LucideIcon name={item.budget.category.icon} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                              {item.budget.category.name}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.overAmount > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>
                              {Math.round(item.percentage)}%
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                              <span className="text-slate-900 dark:text-white">
                                {item.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                              <span className="mx-1 opacity-40">/</span>
                              <span>{item.budget.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              <span className="ml-1 text-[9px] uppercase tracking-wider">{user?.primary_currency || 'AED'}</span>
                            </p>
                            {item.remaining > 0 ? (
                              <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider">
                                {item.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} left
                              </p>
                            ) : item.remaining < 0 ? (
                              <p className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider">
                                {Math.abs(item.remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })} over
                              </p>
                            ) : null}
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressWidth}%` }}
                              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'circOut' }}
                          className="overflow-hidden border-t border-slate-100/60 bg-slate-50/70 dark:border-white/5 dark:bg-black/15"
                        >
                          <div className="space-y-3 p-5">
                            {item.transactions.length === 0 ? (
                              <p className="py-3 text-sm font-medium text-slate-500 dark:text-slate-400">No transactions recorded in this category for the selected month.</p>
                            ) : (
                              <>
                                {item.transactions.slice(0, 5).map((transaction) => (
                                  <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-[1.3rem] bg-white/80 px-4 py-3 dark:bg-white/5">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                        {transaction.merchant_name || transaction.description || item.budget.category.name}
                                      </p>
                                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{formatDateLabel(transaction.date)}</p>
                                    </div>
                                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCurrency(Math.abs(Number(transaction.amount)), user?.primary_currency || 'AED')}</span>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => router.push(`/transactions?category=${item.budget.category_id}&month=${referenceDate.toISOString().split('T')[0]}`)}
                                  className="w-full rounded-[1.3rem] bg-white px-4 py-3 text-sm font-bold text-emerald-500 transition active:scale-95 dark:bg-white/5"
                                >
                                  View all {item.transactions.length} transactions {'->'}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          {isCurrentMonthView ? (
            <Button fullWidth onClick={openEditor} className="rounded-3xl py-5 text-base font-bold">
              <Pencil className="h-4 w-4" />
              Edit Budgets
            </Button>
          ) : (
            <div 
              onClick={() => setMonthOffset(0)}
              className="cursor-pointer rounded-[1.6rem] border border-amber-500/20 bg-amber-500/10 px-4 py-5 text-center transition-all hover:bg-amber-500/15 active:scale-[0.98]"
            >
              <p className="text-sm font-bold text-amber-600 dark:text-amber-300">
                Past months are read-only.
              </p>
              <p className="mt-1 text-xs font-medium text-amber-500/80">
                Tap here to switch back to the current month.
              </p>
            </div>
          )}
        </div>

        <BottomSheet
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setShowResetConfirm(false);
          }}
          title="Edit Budgets"
          footer={
            <div className="space-y-3">
              <Button fullWidth onClick={handleSaveBudgets} loading={saving} className="rounded-3xl py-5 text-base font-bold">
                Save Budgets
              </Button>
              <button
                type="button"
                onClick={() => setShowResetConfirm((current) => !current)}
                className="w-full text-center text-sm font-bold text-emerald-500"
              >
                Reset to Auto
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="rounded-[1.8rem] bg-slate-50 p-5 dark:bg-white/5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 sm:tracking-[0.18em]">Monthly Income</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatCurrency(monthlyIncome, user?.primary_currency || 'AED')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 sm:tracking-[0.18em]">Total Budgeted</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(totalBudgetedDraft, user?.primary_currency || 'AED')}
                    <span className="block text-[10px] font-medium opacity-60">
                      {monthlyIncome > 0 ? `(${Math.round((totalBudgetedDraft / monthlyIncome) * 100)}%)` : ''}
                    </span>
                  </p>
                </div>
                <div className="col-span-2 space-y-1 border-t border-slate-200/50 pt-4 dark:border-white/5 sm:col-span-1 sm:border-t-0 sm:pt-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 sm:tracking-[0.18em]">Unallocated</p>
                  <p className={`text-sm font-extrabold ${unallocatedIncome < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {formatCurrency(unallocatedIncome, user?.primary_currency || 'AED')}
                  </p>
                </div>
              </div>
              {unallocatedIncome < 0 ? (
                <div className="mt-4 flex items-start gap-3 rounded-[1.4rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-300">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>You&apos;re budgeting more than you earn.</span>
                </div>
              ) : null}
            </div>

            {showResetConfirm ? (
              <div className="rounded-[1.6rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">Reset all budgets to the recommended split?</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setShowResetConfirm(false)}>
                    Cancel
                  </Button>
                  <Button fullWidth onClick={applyAutoBudgetDraft}>
                    Apply Auto Split
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-5">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Core Expenses</p>
                <div className="space-y-3">
                  {regularCategories.map((category) => (
                    <CategoryBudgetRow
                      key={category.id}
                      category={category}
                      value={draftBudgets[category.id] || ''}
                      onChange={(id, value) => setDraftBudgets((current) => ({ ...current, [id]: value }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Islamic Giving</p>
                <div className="space-y-3">
                  {islamicCategories.map((category) => (
                    <CategoryBudgetRow
                      key={category.id}
                      category={category}
                      value={draftBudgets[category.id] || ''}
                      onChange={(id, value) => setDraftBudgets((current) => ({ ...current, [id]: value }))}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </BottomSheet>

        <Toast message={toast.message} tone={toast.tone} />
      </div>
    </PageTransition>
  );
}
