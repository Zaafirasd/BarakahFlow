'use client';

import { CURRENCIES } from '@/lib/constants/categories';
import { formatDayLabel } from '@/lib/utils/getFinancialMonth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { OnboardingData } from '@/types';

interface StepBasicInfoProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepBasicInfo({ data, updateData, onNext }: StepBasicInfoProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-[2.2rem] font-extrabold tracking-tight text-slate-900 dark:text-white Montserrat">About you</h2>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Let&apos;s personalize your experience</p>
      </div>

      <div className="space-y-6">
        <Input
          label="What's your name?"
          placeholder="Enter your name"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          id="onboarding-name"
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-4">Currency</label>
          <div className="relative">
            <select
              value={data.currency}
              onChange={(e) => updateData({ currency: e.target.value })}
              className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              id="onboarding-currency"
            >
              {CURRENCIES.map((currency) => (
                <option
                  key={currency.code}
                  value={currency.code}
                  className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                >
                  {currency.code} — {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-4">Current Balance (Starting Funds)</label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={data.initialBalance || ''}
              onChange={(e) => updateData({ initialBalance: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-lg font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              id="onboarding-balance"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-widest">{data.currency}</span>
          </div>
          <p className="mt-1 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-tight">
            How much cash/bank balance do you have right now?
          </p>
        </div>
      </div>

      <Button onClick={onNext} fullWidth size="lg" disabled={!data.name.trim()}>
        Continue
      </Button>
    </div>
  );
}
