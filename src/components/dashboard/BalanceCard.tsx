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

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col rounded-2xl bg-slate-100/80 px-2 py-3 text-center dark:bg-white/5">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 leading-tight">Income</span>
          <p className="mt-1.5 text-sm font-extrabold leading-tight text-slate-900 dark:text-white tabular-nums">
            {Math.floor(income).toLocaleString()}
          </p>
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono">{currency}</p>
        </div>

        <div className="flex flex-col rounded-2xl bg-slate-100/80 px-2 py-3 text-center dark:bg-white/5">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 leading-tight">Spend</span>
          <p className="mt-1.5 text-sm font-extrabold leading-tight text-slate-900 dark:text-white tabular-nums">
            {Math.floor(expenses).toLocaleString()}
          </p>
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono">{currency}</p>
        </div>

        <div className="flex flex-col rounded-2xl bg-slate-100/80 px-2 py-3 text-center dark:bg-white/5">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 leading-tight">Net</span>
          <p className={`mt-1.5 text-sm font-extrabold leading-tight tabular-nums ${net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {net >= 0 ? '+' : ''}{Math.floor(net).toLocaleString()}
          </p>
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono">{currency}</p>
        </div>
      </div>
    </Card>
  );
}
