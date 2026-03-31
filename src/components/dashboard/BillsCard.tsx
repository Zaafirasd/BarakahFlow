import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { daysUntil, formatBillFrequency, formatDayLabel } from '@/lib/utils/getFinancialMonth';
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
          <div>
            <div className="mb-2 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:bg-sky-500/12 dark:text-sky-300">
              Bills
            </div>
            <p className="text-base font-semibold text-slate-950 dark:text-white">No bills tracked</p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
      </Card>
    );
  }

  const nextBill = bills[0];
  const days = daysUntil(nextBill.next_due_date);
  const isOverdue = days < 0;

  return (
    <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300">
              Bills
            </span>
            <span className="text-slate-400 dark:text-slate-500">{isOverdue ? 'OVERDUE' : 'UPCOMING'}</span>
          </div>
          <p className="truncate text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{nextBill.name}</p>
          <p className={`mt-1.5 text-[13px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {isOverdue ? 'Payment overdue' : `Due in ${days} days`} • {Math.floor(nextBill.amount).toLocaleString()} {currency}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isOverdue ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/15' : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'}`}>
          {isOverdue ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
        </div>
      </div>
    </Card>
  );
}
