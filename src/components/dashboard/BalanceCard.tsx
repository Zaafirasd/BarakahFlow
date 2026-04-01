'use client';

import { memo, useMemo } from 'react';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Card from '@/components/ui/Card';
import type { Transaction } from '@/types';

interface BalanceCardProps {
  transactions: Transaction[];
  totalBalance: number;
  currency: string;
}

export default memo(function BalanceCard({ transactions, totalBalance, currency }: BalanceCardProps) {
  const { income, expenses, net } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of transactions) {
      if (t.type === 'income') inc += Math.abs(t.amount);
      else exp += Math.abs(t.amount);
    }
    return { income: inc, expenses: exp, net: inc - exp };
  }, [transactions]);

  return (
    <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300">
            Current Balance
          </div>
        </div>
        <Wallet className="h-5 w-5 text-slate-400" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Total Available
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white Montserrat">
              {formatCurrency(totalBalance, currency)}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
            <div className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:bg-orange-500/12 dark:text-orange-300">
              Flow
            </div>
            <span className="text-[11px] font-medium text-slate-400">Net this month:</span>
            <span className={`text-[11px] font-bold ${net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-slate-100/50 p-4 dark:bg-white/5">
          <div className="flex flex-1 flex-col border-r border-slate-200 dark:border-white/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Income</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(income, currency)}</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Spending</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-rose-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(expenses, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});
