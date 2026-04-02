'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Briefcase, PiggyBank } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '@/lib/constants/categories';
import Button from '@/components/ui/Button';
import type { OnboardingData } from '@/types';

interface StepIncomeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepIncome({ data, updateData, onNext }: StepIncomeProps) {
  const [showTypeSelection, setShowTypeSelection] = useState(!data.incomeType || data.incomeType === 'salary' && data.income === 0);
  const symbol = CURRENCY_SYMBOLS[data.currency] || data.currency;

  const handleTypeSelect = (type: 'salary' | 'freelance' | 'none') => {
    updateData({ incomeType: type });
    if (type === 'none') {
      updateData({ income: 0, payDay: 1 });
      onNext();
    } else {
      setShowTypeSelection(false);
    }
  };

  const incomeTypeLabel = {
    salary: 'Monthly salary',
    freelance: 'Average monthly income',
    none: 'Existing funds'
  };

  return (
    <AnimatePresence mode="wait">
      {showTypeSelection ? (
        <motion.div
          key="selection"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white Montserrat">How do you earn?</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Choose the profile that fits you best</p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => handleTypeSelect('salary')}
              className="group relative flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                <Banknote size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Fixed Salary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Monthly paycheck on a fixed date</p>
              </div>
            </button>

            <button
              onClick={() => handleTypeSelect('freelance')}
              className="group relative flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Variable Flow</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Freelance, business, or irregular work</p>
              </div>
            </button>

            <button
              onClick={() => handleTypeSelect('none')}
              className="group relative flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                <PiggyBank size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">No Monthly Income</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Budgeting from savings or allowance</p>
              </div>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="input"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTypeSelection(true)}
              className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500"
            >
              Change Type
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-[2.2rem] font-extrabold tracking-tight text-slate-900 dark:text-white Montserrat">{incomeTypeLabel[data.incomeType]}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">How much do you generate in a typical month?</p>
          </div>

          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black text-slate-400 dark:text-slate-500">{symbol}</span>
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
                autoFocus
                className="w-full bg-transparent text-center text-6xl font-black text-slate-900 focus:outline-none placeholder-slate-200 dark:text-white dark:placeholder-white/10"
                id="onboarding-income"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <Button onClick={onNext} disabled={data.income <= 0} fullWidth size="lg" className="rounded-[1.8rem] py-5 text-lg font-black shadow-2xl shadow-emerald-500/25">
              Continue
            </Button>
            <p className="px-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-relaxed">
              This helps us calculate your budgets. You can change this anytime.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
