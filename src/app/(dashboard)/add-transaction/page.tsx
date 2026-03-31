'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CURRENCY_SYMBOLS } from '@/lib/constants/categories';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import type { Category, User } from '@/types';
import * as LucideIcons from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const Icon = icons[name];
  return Icon ? <Icon className={className} /> : <LucideIcons.CircleDot className={className} />;
};

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

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      if (!user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (profile) setUser(profile);
      }

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${authUser.id},user_id.is.null`)
        .eq('type', type)
        .order('sort_order');

      setCategories(cats || []);
      if (selectedCategory && !cats?.find(c => c.id === selectedCategory.id)) {
        setSelectedCategory(null);
      }
    };

    fetchData();
  }, [type]);

  const handleSave = async () => {
    if (!amount || !selectedCategory || !user) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .limit(1);

      const accountId = accounts?.[0]?.id;
      if (!accountId) throw new Error('No account found');

      const numAmount = parseFloat(amount);

      await supabase.from('transactions').insert({
        user_id: authUser.id,
        account_id: accountId,
        category_id: selectedCategory.id,
        amount: type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount),
        type,
        merchant_name: description || null,
        date,
      });

      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error(err);
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
      <div className="min-h-screen px-5 pb-12 pt-4">
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
              <div className="grid grid-cols-4 gap-2.5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border transition-all active:scale-90 ${
                      selectedCategory?.id === cat.id
                        ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                        : 'border-slate-100 bg-white dark:border-white/5 dark:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      <IconComponent name={cat.icon} className="w-5 h-5" />
                    </div>
                    <span className="truncate w-full px-1 text-[9px] font-extrabold uppercase tracking-tighter text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </span>
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
                  placeholder="Where did you spend?"
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
            <div className="mt-6">
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
    </PageTransition>
  );
}
