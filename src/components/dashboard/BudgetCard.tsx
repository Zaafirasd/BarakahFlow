'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getFinancialMonthRange } from '@/lib/utils/getFinancialMonth';
import BudgetRing from '@/components/budget/BudgetRing';
import Card from '@/components/ui/Card';
import type { Transaction, Budget } from '@/types';

interface BudgetCardProps {
  budgets: Budget[];
  transactions: Transaction[];
  currency: string;
  startDay: number;
}

export default function BudgetCard({ budgets, transactions, currency, startDay }: BudgetCardProps) {
  const router = useRouter();

  const totalBudgeted = useMemo(() => budgets.reduce((sum, budget) => sum + budget.amount, 0), [budgets]);
  const totalSpent = useMemo(
    () => transactions.filter(t => t.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    [transactions]
  );

  const percentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const remaining = Math.max(totalBudgeted - totalSpent, 0);
  const financialMonthEnd = getFinancialMonthRange(startDay).end;
  const daysLeft = Math.max(
    Math.ceil((financialMonthEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

  return (
    <button type="button" onClick={() => router.push('/budget')} className="block w-full text-left">
      <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                Monthly Budget
              </span>
            </div>

            {budgets.length === 0 ? (
              <div className="mt-4">
                <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">Plan your month</p>
                <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">Tap to set budget limits</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {formatCurrency(totalSpent, currency)}
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-none">
                    / {formatCurrency(totalBudgeted, currency)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(remaining, currency)} left
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    in {daysLeft} days
                  </span>
                </div>
              </div>
            )}
          </div>

          {budgets.length > 0 ? (
            <div className="flex flex-shrink-0 flex-col items-center gap-2">
              <BudgetRing percentage={percentage} size={76} strokeWidth={7} topLabel="" />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Usage</span>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-white/10">
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          )}
        </div>
      </Card>
    </button>
  );
}
