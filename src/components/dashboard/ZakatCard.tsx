import { Moon } from 'lucide-react';
import { daysUntil } from '@/lib/utils/getFinancialMonth';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Card from '@/components/ui/Card';

interface ZakatCardProps {
  zakatDate: string | null;
  balance: number;
  currency: string;
  estimate?: number | null;
}

export default function ZakatCard({ zakatDate, balance, currency, estimate }: ZakatCardProps) {
  if (!zakatDate) return null;

  const anniversary = new Date(zakatDate);
  const today = new Date();
  anniversary.setFullYear(today.getFullYear());

  if (anniversary < today) {
    anniversary.setFullYear(today.getFullYear() + 1);
  }

  const days = daysUntil(anniversary);
  const zakatEstimate = typeof estimate === 'number' ? Math.max(0, estimate) : Math.max(0, balance * 0.025);

  return (
    <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Moon className="h-7 w-7 fill-emerald-600 dark:fill-emerald-300" />
        </div>
        <div className="flex flex-col gap-1.5 pt-0.5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
              Zakat
            </span>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">DUE IN {days} DAYS</span>
          </div>
          <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {Math.floor(zakatEstimate).toLocaleString()} <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{currency}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
