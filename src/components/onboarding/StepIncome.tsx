'use client';

import { CURRENCY_SYMBOLS } from '@/lib/constants/categories';
import Button from '@/components/ui/Button';
import type { OnboardingData } from '@/types';

interface StepIncomeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepIncome({ data, updateData, onNext }: StepIncomeProps) {
  const symbol = CURRENCY_SYMBOLS[data.currency] || data.currency;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Monthly income</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">What&apos;s your total monthly income?</p>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl text-slate-500 dark:text-slate-400">{symbol}</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={data.income || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                updateData({ income: 0 });
                return;
              }
              const num = parseFloat(val);
              if (num >= 0) {
                updateData({ income: num });
              }
            }}
            min="0"
            className="w-full bg-transparent text-center text-5xl font-bold text-slate-900 focus:outline-none placeholder-slate-400 dark:text-white dark:placeholder-slate-600"
            id="onboarding-income"
          />
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">per month</p>
      </div>

      <div className="space-y-4 pt-4">
        <Button onClick={onNext} fullWidth size="lg" className="rounded-[1.8rem] py-5 text-lg font-black shadow-2xl shadow-emerald-500/25">
          Continue
        </Button>
        <button
          type="button"
          onClick={() => {
            updateData({ income: 0 });
            onNext();
          }}
          className="w-full text-xs font-black uppercase tracking-[0.1em] text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          Skip this if you don&apos;t have a steady income
        </button>
      </div>
    </div>
  );
}
