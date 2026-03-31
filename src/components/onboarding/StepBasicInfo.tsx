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
  const payDays = Array.from({ length: 31 }, (_, i) => i + 1);

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

        <div className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">What day do you get paid?</label>
            {data.payDay !== undefined && (
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Day {data.payDay === 0 ? 'Last' : data.payDay}</span>
            )}
          </div>
          
          <div className="grid grid-cols-7 gap-2 rounded-[2.2rem] bg-slate-100/40 p-3 dark:bg-white/5">
            {payDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => updateData({ payDay: day })}
                className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-bold transition-all active:scale-90 ${
                  data.payDay === day
                    ? 'bg-emerald-500 text-white shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)]'
                    : 'border border-transparent bg-white text-slate-600 hover:border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-white'
                }`}
              >
                {day}
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateData({ payDay: 0 })}
              className={`col-span-7 mt-2 flex flex-col items-center justify-center rounded-2xl py-4 transition-all active:scale-[0.97] ${
                data.payDay === 0
                  ? 'bg-emerald-500 text-white shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)]'
                  : 'border border-transparent bg-white text-slate-600 hover:border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-white'
              }`}
            >
              <span className="text-sm font-black tracking-tight">{formatDayLabel(0)}</span>
              <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-60 ${data.payDay === 0 ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                Automatically adjusts to month length
              </span>
            </button>
          </div>
        </div>
      </div>

      <Button onClick={onNext} fullWidth size="lg" disabled={!data.name.trim()}>
        Continue
      </Button>
    </div>
  );
}
