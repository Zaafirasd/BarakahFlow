'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CURRENCY_SYMBOLS } from '@/lib/constants/categories';
import { trackEvent, METRICS } from '@/lib/utils/analytics';
import { sanitizeText, validateAmount } from '@/lib/utils/validation';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import type { Category, User } from '@/types';
import LucideIcon from '@/components/ui/LucideIcon';
import { TransactionService } from '@/lib/services/transactions';
import { invalidateDashboardCache } from '@/lib/utils/dashboardCache';

export default function AddTransactionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser || !active) return;

        // Fetch profile + categories in parallel
        const [profileRes, catsRes] = await Promise.all([
          !user
            ? supabase.from('users').select('*').eq('id', authUser.id).single()
            : Promise.resolve({ data: null }),
          supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${authUser.id},user_id.is.null`)
            .eq('type', type)
            .order('sort_order'),
        ]);

        if (profileRes.data && active) setUser(profileRes.data as User);

        const cats = catsRes.data;
        if (cats && active) {
          setCategories(cats as Category[]);
          if (selectedCategory && !cats.some(c => c.id === selectedCategory.id)) {
            setSelectedCategory(null);
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load transaction form.');
      }
    };

    void fetchData();
    return () => { active = false; };
  }, [type, user?.id]); // Depend on type and user.id 


  const handleSave = async () => {
    const validatedAmount = validateAmount(amount);

    if (!user) {
      setError('Please complete onboarding before adding transactions.');
      return;
    }

    if (!selectedCategory) {
      setError('Please choose a category.');
      return;
    }

    if (validatedAmount === null || validatedAmount <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Please sign in again to save this transaction.');
      }

      const { data: accounts, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .limit(1);

      if (accountError) {
        throw new Error(accountError.message);
      }

      const accountId = accounts?.[0]?.id;
      if (!accountId) {
        throw new Error('No active account found.');
      }

      await TransactionService.create({
        userId: authUser.id,
        accountId,
        categoryId: selectedCategory.id,
        amount: validatedAmount || 0,
        type,
        merchantName: description,
        date,
      });

      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const symbol = CURRENCY_SYMBOLS[user?.primary_currency || 'AED'] || 'AED';

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950 px-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40">
            <Check className="h-12 w-12 stroke-[3]" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Transaction Added</h2>
          <p className="mt-2 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Flowing back to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen px-5 pb-12 pt-[var(--pt-safe)]">
        <div className="top-glow" />
        <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-slate-400 shadow-sm backdrop-blur-xl transition active:scale-95 dark:border-white/10 dark:bg-slate-900/76">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Add Transaction</h1>
          <div className="w-11" /> {/* Spacer */}
        </div>

        {/* Amount Input */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Enter Amount</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-extrabold text-slate-300 dark:text-slate-600 Montserrat">{symbol}</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full max-w-[240px] bg-transparent text-center text-6xl font-extrabold tracking-tighter text-slate-900 focus:outline-none placeholder-slate-200 dark:text-white dark:placeholder-white/5 Montserrat"
            />
          </div>
        </div>

        {/* Type Toggle */}
        <div className="mb-8 p-1.5 flex rounded-3xl bg-slate-100 dark:bg-white/5 relative">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest z-10 transition-colors ${
              type === 'expense' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Expense
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest z-10 transition-colors ${
              type === 'income' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Income
          </button>
          <motion.div
            layoutId="type-bg"
            className={`absolute inset-1.5 w-[calc(50%-6px)] rounded-2xl shadow-lg ${
              type === 'expense' ? 'bg-rose-500 left-1.5' : 'bg-emerald-500 left-[calc(50%+1.5px)]'
            }`}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>

        <StaggerContainer>
          {/* Category Section */}
          <StaggerItem>
            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Select Category</h3>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Required</span>
              </div>
              <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto px-1 snap-y pb-2 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-4 p-3 rounded-2xl border transition-all active:scale-[0.98] shrink-0 snap-start text-left ${
                      selectedCategory?.id === cat.id
                        ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                        : 'border-slate-100 bg-white dark:border-white/5 dark:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      <LucideIcon name={cat.icon} className="w-6 h-6" />
                    </div>
                    <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                    {selectedCategory?.id === cat.id && (
                       <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                         <Check className="h-4 w-4 stroke-[3]" />
                       </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Details Section */}
          <StaggerItem>
            <div className="mb-10 space-y-4">
              <div className="px-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Optional Details</h3>
              </div>
              <div className="group rounded-[2rem] border border-slate-100 bg-white p-2 dark:border-white/5 dark:bg-white/5 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-sm">
                <input
                  type="text"
                  placeholder={type === 'expense' ? "Where did you spend?" : "Where did this income come from?"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-transparent px-4 py-4 text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none dark:text-white dark:placeholder-white/10 Montserrat"
                />
              </div>
              <div className="rounded-[2rem] border border-slate-100 bg-white p-2 dark:border-white/5 dark:bg-white/5 shadow-sm">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent px-4 py-4 text-sm font-bold text-slate-900 focus:outline-none [color-scheme:light] dark:text-white dark:[color-scheme:dark] Montserrat"
                />
              </div>
            </div>
          </StaggerItem>

          {/* Action */}
          <StaggerItem>
            <div className="mt-6 space-y-3">
              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              ) : null}
              <Button
                fullWidth
                disabled={!amount || parseFloat(amount) <= 0 || !selectedCategory}
                loading={loading}
                onClick={handleSave}
                className="rounded-[2rem] py-6 text-base font-extrabold shadow-2xl shadow-emerald-500/20"
              >
                Done
              </Button>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
    </PageTransition>
  );
}
