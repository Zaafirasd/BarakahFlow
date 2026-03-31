'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { getFinancialMonthRange } from '@/lib/utils/getFinancialMonth';
import { getZakatStorageKey } from '@/lib/utils/zakat';
import BalanceCard from '@/components/dashboard/BalanceCard';
import BudgetCard from '@/components/dashboard/BudgetCard';
import BillsCard from '@/components/dashboard/BillsCard';
import ZakatCard from '@/components/dashboard/ZakatCard';
import type { User, Transaction, Budget, Bill } from '@/types';
import PageTransition from '@/components/ui/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [zakatEstimate, setZakatEstimate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);
        if (typeof window !== 'undefined') {
          const stored = window.localStorage.getItem(getZakatStorageKey(profile.id));
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as { result?: { zakatDue?: number } };
              setZakatEstimate(typeof parsed.result?.zakatDue === 'number' ? parsed.result.zakatDue : null);
            } catch {
              setZakatEstimate(null);
            }
          } else {
            setZakatEstimate(null);
          }
        }

        const { start, end } = getFinancialMonthRange(profile.financial_month_start_day);

        const { data: txns } = await supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .eq('user_id', authUser.id)
          .gte('date', start.toISOString().split('T')[0])
          .lte('date', end.toISOString().split('T')[0])
          .order('date', { ascending: false });

        setTransactions(txns || []);

        const { data: budgetData } = await supabase
          .from('budgets')
          .select('*, category:categories(*)')
          .eq('user_id', authUser.id)
          .eq('is_active', true);

        setBudgets(budgetData || []);

        const { data: billData } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('is_active', true)
          .order('next_due_date', { ascending: true })
          .limit(3);

        setBills(billData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden px-5 pb-28 pt-4">
        <div className="absolute inset-x-0 top-0 h-80 rounded-b-[3.5rem] bg-gradient-to-br from-rose-200/90 via-violet-200/80 to-sky-200/70 dark:from-rose-400/20 dark:via-indigo-500/15 dark:to-sky-400/10" />
        <div className="absolute right-[-5rem] top-24 h-48 w-48 rounded-full bg-white/40 blur-3xl dark:bg-cyan-400/5" />
        <div className="absolute left-[-4rem] top-8 h-40 w-40 rounded-full bg-rose-100/60 blur-3xl dark:bg-fuchsia-400/5" />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4 pt-2">
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="group flex flex-col items-start transition-opacity active:opacity-70"
              >
                <span className="text-[13px] font-semibold text-slate-500 transition group-hover:text-emerald-500 dark:text-slate-400 dark:group-hover:text-emerald-400">
                  Assalamu Alaikum, <span className="text-slate-900 dark:text-white">{user?.name?.split(' ')[0] || 'there'}</span>
                </span>
                <h1 className="mt-0.5 text-[2.75rem] font-black tracking-[-0.03em] text-slate-900 dark:text-white">
                  Summary
                </h1>
              </button>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                {today}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/60 text-slate-700 shadow-sm backdrop-blur-md transition-all active:scale-95 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100"
                aria-label="Toggle theme"
              >
                {mounted && resolvedTheme === 'dark' ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <StaggerContainer className="flex flex-col gap-3.5">

            <StaggerItem>
              <BalanceCard transactions={transactions} currency={user?.primary_currency || 'AED'} />
            </StaggerItem>

            <StaggerItem>
              <BudgetCard
                budgets={budgets}
                transactions={transactions}
                currency={user?.primary_currency || 'AED'}
                startDay={user?.financial_month_start_day ?? 1}
              />
            </StaggerItem>

            <StaggerItem>
              <button type="button" onClick={() => router.push('/bills')} className="block w-full text-left">
                <BillsCard bills={bills} currency={user?.primary_currency || 'AED'} />
              </button>
            </StaggerItem>

            {user?.zakat_enabled && (
              <StaggerItem>
                <button type="button" onClick={() => router.push('/zakat')} className="block w-full text-left">
                  <ZakatCard 
                    zakatDate={user.zakat_anniversary_date}
                    balance={transactions.reduce((acc, txn) => txn.type === 'income' ? acc + txn.amount : acc - txn.amount, 0)}
                    currency={user.primary_currency || 'AED'}
                    estimate={zakatEstimate}
                  />
                </button>
              </StaggerItem>
            )}
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
}
