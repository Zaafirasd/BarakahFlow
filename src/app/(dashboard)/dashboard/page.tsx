'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { getFinancialMonthRange } from '@/lib/utils/getFinancialMonth';
import BalanceCard from '@/components/dashboard/BalanceCard';
import BudgetCard from '@/components/dashboard/BudgetCard';
import BillsCard from '@/components/dashboard/BillsCard';
import GoldCard from '@/components/dashboard/GoldCard';
import GoldModal from '@/components/dashboard/GoldModal';
import type { Account, User, Transaction, Budget, Bill } from '@/types';
import PageTransition from '@/components/ui/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

import { 
  getCachedDashboardData, 
  setCachedDashboardData, 
  invalidateDashboardCache,
  updateCachedUser,
  type DashboardData 
} from '@/lib/utils/dashboardCache';

export default function DashboardPage() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goldPrice, setGoldPrice] = useState<number>(561.42);
  const [isGoldCached, setIsGoldCached] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
  const [error, setError] = useState('');

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setLoading(false);
          return;
        }

        // 1. Check user-keyed cache first
        const cached = getCachedDashboardData(authUser.id);
        if (cached) {
          setUser(cached.user);
          setTransactions(cached.transactions);
          setAllTransactions(cached.allTransactions);
          setAccounts(cached.accounts);
          setBudgets(cached.budgets);
          setBills(cached.bills);
          setGoldPrice(cached.goldPrice);
          setIsGoldCached(cached.isGoldCached);

          setLoading(false);
          return;
        }

        // 2. Cache miss -> Fetch all data from DB
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError || !profile) {
          throw new Error(profileError?.message || 'Unable to load your dashboard profile.');
        }

        // Load local gold fallback
        let localGold = 0;
        try {
          const storedGold = localStorage.getItem(`barakahflow_gold_${profile.id}`);
          if (storedGold) localGold = parseFloat(storedGold) || 0;
        } catch { /* localStorage unavailable */ }

        const userWithGold: User = { ...profile, gold_grams: profile.gold_grams || localGold };
        setUser(userWithGold);

        const { start, end } = getFinancialMonthRange(profile.financial_month_start_day);

        // Fetch all data in parallel — gold price included
        const [
          monthTransactionsResult,
          allTransactionsResult,
          accountsResult,
          budgetResult,
          billResult,
          goldRes,
        ] = await Promise.all([
          supabase
            .from('transactions')
            .select('*, category:categories(*)')
            .eq('user_id', authUser.id)
            .is('deleted_at', null)
            .gte('date', start.toISOString().split('T')[0])
            .lte('date', end.toISOString().split('T')[0])
            .order('date', { ascending: false }),
          supabase
            .from('transactions')
            .select('id, user_id, account_id, category_id, amount, merchant_name, description, date, type')
            .eq('user_id', authUser.id)
            .is('deleted_at', null),
          supabase
            .from('accounts')
            .select('id, user_id, name, type, currency, opening_balance, is_active, created_at')
            .eq('user_id', authUser.id)
            .eq('is_active', true),
          supabase
            .from('budgets')
            .select('*, category:categories(*)')
            .eq('user_id', authUser.id)
            .eq('is_active', true),
          supabase
            .from('bills')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('is_active', true)
            .order('next_due_date', { ascending: true })
            .limit(3),
          fetch(`/api/gold-price?currency=${profile.primary_currency || 'AED'}`).catch(() => null),
        ]);

        const firstError =
          monthTransactionsResult.error ||
          allTransactionsResult.error ||
          accountsResult.error ||
          budgetResult.error ||
          billResult.error;

        if (firstError) {
          throw new Error(firstError.message);
        }

        const accs = (accountsResult.data || []) as Account[];

        // Force onboarding if no active accounts exist
        if (accs.length === 0) {
          router.push('/onboarding');
          return;
        }

        const txns = (monthTransactionsResult.data || []) as Transaction[];
        const allTxns = (allTransactionsResult.data || []) as Transaction[];
        const budgts = (budgetResult.data || []) as Budget[];
        const blls = (billResult.data || []) as Bill[];

        let gPrice = 561.42;
        let gCached = true;
        if (goldRes?.ok) {
          try {
            const goldData = (await goldRes.json()) as { price_per_gram?: number; cached?: boolean };
            if (goldData.price_per_gram) {
              gPrice = goldData.price_per_gram;
              gCached = Boolean(goldData.cached);
            }
          } catch {
            /* use default */
          }
        }

        setTransactions(txns);
        setAllTransactions(allTxns);
        setAccounts(accs);
        setBudgets(budgts);
        setBills(blls);
        setGoldPrice(gPrice);
        setIsGoldCached(gCached);

        // Cache results for fast return navigation
        setCachedDashboardData(authUser.id, {
          user: userWithGold,
          transactions: txns,
          allTransactions: allTxns,
          accounts: accs,
          budgets: budgts,
          bills: blls,
          goldPrice: gPrice,
          isGoldCached: gCached,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load your dashboard right now.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const today = useMemo(() => new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  }), []);

  const totalBalance = useMemo(() => {
    const opening = accounts.reduce((sum, a) => sum + Number(a.opening_balance || 0), 0);
    const txns = allTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return opening + txns;
  }, [accounts, allTransactions]);

  const goldValue = useMemo(
    () => (user?.gold_grams || 0) * goldPrice,
    [user?.gold_grams, goldPrice]
  );

  const handleOpenGoldModal = useCallback(() => setIsGoldModalOpen(true), []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden px-5 pb-32 pt-[var(--pt-safe)]">
        <div className="absolute inset-x-0 top-0 h-[28rem] rounded-b-[3.5rem] bg-gradient-to-br from-rose-200/90 via-violet-200/80 to-sky-200/70 dark:from-rose-400/20 dark:via-indigo-500/15 dark:to-sky-400/10" />

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
                {resolvedTheme === 'dark' ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mb-4 rounded-[1.6rem] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          ) : null}

          <StaggerContainer className="flex flex-col gap-3.5">

            <StaggerItem>
              <BalanceCard
                transactions={transactions}
                totalBalance={totalBalance}
                currency={user?.primary_currency || 'AED'}
              />
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
              <button type="button" onClick={() => router.push('/bills')} className="group block w-full text-left">
                <BillsCard bills={bills} currency={user?.primary_currency || 'AED'} />
              </button>
            </StaggerItem>

            <StaggerItem>
              <GoldCard
                grams={user?.gold_grams || 0}
                currency={user?.primary_currency || 'AED'}
                pricePerGram={goldPrice}
                isCachedPrice={isGoldCached}
                onManage={handleOpenGoldModal}
                onZakatClick={() => router.push('/zakat?section=gold')}
              />
            </StaggerItem>
          </StaggerContainer>
        </div>

      </div>
    </PageTransition>

    <GoldModal
      isOpen={isGoldModalOpen}
      onClose={() => setIsGoldModalOpen(false)}
      currentGrams={user?.gold_grams || 0}
      userId={user?.id || ''}
      onUpdate={(newGrams) => {
        if (user) {
          const updated = { ...user, gold_grams: newGrams };
          setUser(updated);
          updateCachedUser(user.id, updated);
        }
      }}
    />
  </>
  );
}
