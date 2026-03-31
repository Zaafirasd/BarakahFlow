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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                Budget
              </div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{budgets.length > 0 ? 'ON TRACK' : 'NOT SET'}</span>
            </div>

            {budgets.length === 0 ? (
              <>
                <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Plan your month</p>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Tap to set budget limits.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {Math.floor(totalSpent).toLocaleString()} of {Math.floor(totalBudgeted).toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{currency}</span>
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-500 dark:text-emerald-400">{Math.floor(remaining).toLocaleString()} {currency}</span> left for {daysLeft} days
                </p>
              </>
            )}
          </div>

          {budgets.length > 0 ? (
            <div className="flex flex-col items-center gap-1.5 translate-y-1">
              <BudgetRing percentage={percentage} size={84} strokeWidth={8} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">View details</span>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          )}
        </div>
      </Card>
    </button>
  );
}
