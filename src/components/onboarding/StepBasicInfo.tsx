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
  const payDays = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="mb-2 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">About you</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Let&apos;s personalize your experience</p>
      </div>

      <Input
        label="What's your name?"
        placeholder="Enter your name"
        value={data.name}
        onChange={(e) => updateData({ name: e.target.value })}
        id="onboarding-name"
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          What&apos;s your currency?
        </label>
        <select
          value={data.currency}
          onChange={(e) => updateData({ currency: e.target.value })}
          className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
          id="onboarding-currency"
        >
          {CURRENCIES.map((currency) => (
            <option
              key={currency.code}
              value={currency.code}
              className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
            >
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          What day do you get paid?
        </label>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-500">
          If your salary comes on the 25th, pick 25
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {payDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => updateData({ payDay: day })}
              className={`rounded-lg py-2 text-sm font-medium transition-all ${
                data.payDay === day
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {day}
            </button>
          ))}
          <button
            type="button"
            onClick={() => updateData({ payDay: 0 })}
            className={`col-span-7 rounded-lg py-2.5 text-sm font-medium transition-all ${
              data.payDay === 0
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            {formatDayLabel(0)}
          </button>
        </div>
      </div>

      <Button onClick={onNext} fullWidth size="lg" disabled={!data.name.trim()}>
        Continue
      </Button>
    </div>
  );
}
