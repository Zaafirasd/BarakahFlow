import { MoonStar } from 'lucide-react';
import { getNextAnniversary } from '@/lib/utils/zakat';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import Card from '@/components/ui/Card';

interface ZakatCardProps {
  zakatDate: string | null;
  balance: number;
  currency: string;
  estimate?: number | null;
  goldValue?: number | null;
  goldPrice?: number;
}

export default function ZakatCard({ zakatDate, balance, currency, estimate }: ZakatCardProps) {
  if (!zakatDate) return null;

  const anniversary = getNextAnniversary(zakatDate);
  const days = anniversary?.daysUntil ?? 0;

  return (
    <Card className="border border-white/70 bg-white/82 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Personal Zakat Status
            </span>
          </div>
          
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {typeof estimate === 'number' ? formatCurrency(estimate, currency) : 'Update Cloud Sync'}
            </span>
          </div>
          
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {anniversary ? `Anniversary in ${days} days` : 'Set Anniversary'}
          </p>
        </div>

        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.2rem] bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <MoonStar className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
