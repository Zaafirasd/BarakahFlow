'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import type { OnboardingData } from '@/types';

interface StepZakatProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepZakat({ data, updateData, onNext }: StepZakatProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Zakat tracking</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Do you want to track Zakat?</p>
      </div>

      <div className="flex justify-center">
        <div className="relative flex w-full max-w-[280px] items-center rounded-2xl bg-slate-100 p-1.5 dark:bg-white/5">
          {/* Animated Background Selector */}
          <motion.div
            className={`absolute h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-xl shadow-sm ${
              data.zakatEnabled ? 'bg-emerald-500' : 'bg-white dark:bg-slate-600'
            }`}
            initial={false}
            animate={{
              x: data.zakatEnabled ? '100%' : '0%',
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          />

          <button
            type="button"
            onClick={() => updateData({ zakatEnabled: false })}
            className={`relative flex-1 py-3 text-sm font-black uppercase tracking-widest transition-colors duration-200 ${
              !data.zakatEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            No
          </button>

          <button
            type="button"
            onClick={() => updateData({ zakatEnabled: true })}
            className={`relative flex-1 py-3 text-sm font-black uppercase tracking-widest transition-colors duration-200 ${
              data.zakatEnabled ? 'text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
            }`}
          >
            Yes
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: data.zakatEnabled ? contentHeight : 0,
          opacity: data.zakatEnabled ? 1 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="space-y-3 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="px-2 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
              Zakat anniversary date
            </label>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              When did you first become eligible for Zakat? If unsure, use today&apos;s date.
            </p>
          </div>
          <input
            type="date"
            value={data.zakatDate || ''}
            onChange={(e) => updateData({ zakatDate: e.target.value })}
            className="w-full box-border rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 [color-scheme:light] dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
            id="onboarding-zakat-date"
          />
        </div>
      </motion.div>

      <div className="pt-4">
        <Button onClick={onNext} fullWidth size="lg" className="rounded-[1.8rem] py-5 text-lg font-black shadow-2xl shadow-emerald-500/25">
          Continue
        </Button>
      </div>
    </div>
  );
}
