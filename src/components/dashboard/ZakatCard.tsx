import { Moon } from 'lucide-react';
import { daysUntil } from '@/lib/utils/getFinancialMonth';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Card from '@/components/ui/Card';

interface ZakatCardProps {
  zakatDate: string | null;
  balance: number;
  currency: string;
  estimate?: number | null;
  goldValue?: number | null;
}

export default function ZakatCard({ zakatDate, balance, currency, estimate, goldValue }: ZakatCardProps) {
  if (!zakatDate) return null;

  const anniversary = new Date(zakatDate);
  const today = new Date();
  anniversary.setFullYear(today.getFullYear());

  if (anniversary < today) {
    anniversary.setFullYear(today.getFullYear() + 1);
  }

  const days = daysUntil(anniversary);
  const baseZakat = typeof estimate === 'number' ? Math.max(0, estimate) : Math.max(0, balance * 0.025);
  const goldZakat = (goldValue || 0) * 0.025;
  const totalZakat = baseZakat + goldZakat;

  return (
    <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Estimated Zakat
            </span>
          </div>
          
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {Math.floor(totalZakat).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {currency}
            </span>
          </div>
          
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Due in {days} days
          </p>
        </div>

        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Moon className="h-6 w-6 fill-current" />
        </div>
      </div>
    </Card>
  );
}
