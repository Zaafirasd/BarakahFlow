import { AlertTriangle, Clock } from 'lucide-react';
import { daysUntil } from '@/lib/utils/getFinancialMonth';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Card from '@/components/ui/Card';
import type { Bill } from '@/types';

interface BillsCardProps {
  bills: Bill[];
  currency: string;
}

export default function BillsCard({ bills, currency }: BillsCardProps) {
  if (bills.length === 0) {
    return (
      <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Upcoming Bills
            </span>
          </div>
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">All clear</p>
        </div>
      </Card>
    );
  }

  const nextBill = bills[0];
  const days = daysUntil(nextBill.next_due_date);
  const isOverdue = days < 0;

  return (
    <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOverdue ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              {isOverdue ? 'Overdue Bill' : 'Next Bill'}
            </span>
          </div>
          
          <div className="mt-4 flex items-baseline gap-2">
            <span className="truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {nextBill.name}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {formatCurrency(nextBill.amount, currency)}
            </span>
          </div>
          
          <p className={`mt-1.5 text-[11px] font-bold uppercase tracking-wider ${isOverdue ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {isOverdue ? 'Action required' : `Due in ${days} days`}
          </p>
        </div>

        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${isOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'}`}>
          {isOverdue ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
        </div>
      </div>
    </Card>
  );
}
