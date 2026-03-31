'use client';

import Button from '@/components/ui/Button';
import type { OnboardingData } from '@/types';

interface StepZakatProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepZakat({ data, updateData, onNext }: StepZakatProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Zakat tracking</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Do you want to track Zakat?</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => updateData({ zakatEnabled: false })}
          className={`rounded-xl px-8 py-3 font-semibold transition-all ${
            !data.zakatEnabled
              ? 'border border-slate-200 bg-white text-slate-900 dark:border-white/20 dark:bg-white/15 dark:text-white'
              : 'border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-slate-500'
          }`}
        >
          No
        </button>
        <button
          onClick={() => updateData({ zakatEnabled: true })}
          className={`rounded-xl px-8 py-3 font-semibold transition-all ${
            data.zakatEnabled
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'border border-slate-200 bg-slate-50 text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-slate-500'
          }`}
        >
          Yes
        </button>
      </div>

      {data.zakatEnabled && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Zakat anniversary date
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            When did you first become eligible for Zakat? If unsure, use today&apos;s date.
          </p>
          <input
            type="date"
            value={data.zakatDate || ''}
            onChange={(e) => updateData({ zakatDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:light] dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
            id="onboarding-zakat-date"
          />
        </div>
      )}

      <Button onClick={onNext} fullWidth size="lg">
        Continue
      </Button>
    </div>
  );
}
