import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Card from '@/components/ui/Card';
import type { Transaction } from '@/types';

interface BalanceCardProps {
  transactions: Transaction[];
  currency: string;
}

export default function BalanceCard({ transactions, currency }: BalanceCardProps) {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const net = income - expenses;

  return (
    <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-600 dark:bg-orange-500/12 dark:text-orange-300">
            Activity
          </div>
          <span className="text-xs font-medium text-slate-400">This month</span>
        </div>
        <Wallet className="h-5 w-5 text-slate-400" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
            Net Cash Flow
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight ${net >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
              {net >= 0 ? '+' : '-'}{Math.floor(Math.abs(net)).toLocaleString('en-US')}
            </span>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{currency}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {net >= 0 ? 'You have saved more than you spent' : 'Caution: Monthly spending exceeds income'}
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-slate-100/50 p-4 dark:bg-white/5">
          <div className="flex flex-1 flex-col border-r border-slate-200 dark:border-white/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Income</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.floor(income).toLocaleString('en-US')}</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Spending</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-rose-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.floor(expenses).toLocaleString('en-US')}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
