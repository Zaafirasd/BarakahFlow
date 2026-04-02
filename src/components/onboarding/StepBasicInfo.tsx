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
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-[2.6rem] font-black tracking-tight text-slate-900 dark:text-white Montserrat leading-tight">About you</h2>
        <p className="mt-2 text-base font-medium text-slate-500 dark:text-slate-400">Let&apos;s personalize your experience</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <label className="onboarding-label Montserrat" htmlFor="onboarding-name">What&apos;s your name?</label>
          <input
            id="onboarding-name"
            placeholder="Enter your name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="w-full rounded-[1.8rem] border border-slate-200 bg-white px-6 py-5 text-lg onboarding-input focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <div className="space-y-2">
          <label className="onboarding-label Montserrat" htmlFor="onboarding-currency">Currency</label>
          <div className="relative">
            <select
              id="onboarding-currency"
              value={data.currency}
              onChange={(e) => updateData({ currency: e.target.value })}
              className="w-full cursor-pointer appearance-none rounded-[1.8rem] border border-slate-200 bg-white px-6 py-5 text-lg onboarding-input focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
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
            <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="onboarding-label Montserrat" htmlFor="onboarding-balance">Current Balance (Starting Funds)</label>
          <div className="relative">
            <input
              id="onboarding-balance"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={data.initialBalance || ''}
              onChange={(e) => updateData({ initialBalance: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-[1.8rem] border border-slate-200 bg-white px-6 py-5 text-2xl onboarding-input focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{data.currency}</span>
          </div>
          <p className="mt-3 px-6 text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed italic">
            How much cash, bank balance, or liquid funds do you have right now?
          </p>
        </div>
      </div>
    </div>
  );
}
