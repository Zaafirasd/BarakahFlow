'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import Button from '@/components/ui/Button';
import type { OnboardingData } from '@/types';

interface StepBudgetProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function StepBudget({ data, updateData, onNext }: StepBudgetProps) {
  const income = data.income || 0;
  const needs = income * 0.5;
  const wants = income * 0.25;
  const savings = income * 0.15;
  const giving = income * 0.1;

  const detailsRef = useRef<HTMLDivElement>(null);
  const [detailsHeight, setDetailsHeight] = useState(0);

  useLayoutEffect(() => {
    if (detailsRef.current) {
      setDetailsHeight(detailsRef.current.scrollHeight);
    }
  }, [income]);

  const isAuto = data.budgetChoice === 'auto';
  const isManual = data.budgetChoice === 'manual';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Budget plan</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">How do you want to budget?</p>
      </div>

      {/* Auto option */}
      <motion.button
        type="button"
        onClick={() => updateData({ budgetChoice: 'auto' })}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        aria-pressed={isAuto}
        className="relative w-full text-left outline-none"
      >
        <div
          className={`relative overflow-hidden rounded-[2.2rem] border p-6 transition-colors duration-500 ${
            isAuto
              ? 'border-emerald-500/50 bg-emerald-500/[0.04] shadow-[0_20px_40px_-12px_rgba(16,185,129,0.12)] dark:border-emerald-500/30 dark:bg-emerald-500/[0.02]'
              : 'border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:shadow-none'
          }`}
        >
          <div className="relative flex items-start gap-4">
            <div className="relative h-12 w-12 shrink-0">
              {isAuto && (
                <motion.div
                  layoutId="icon-active-bg"
                  className="absolute inset-0 rounded-2xl bg-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10"
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                />
              )}
              <div className={`relative flex h-full w-full items-center justify-center rounded-2xl transition-colors duration-500 ${
                isAuto ? 'text-white' : 'text-slate-400 dark:text-slate-500'
              }`}>
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Set it up for me</h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Recommended
                </span>
              </div>

              {/* Expandable budget details */}
              <motion.div
                initial={false}
                animate={{
                  height: isAuto && income > 0 ? detailsHeight : 0,
                  opacity: isAuto && income > 0 ? 1 : 0,
                }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div ref={detailsRef} className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <StaggerContainer className="space-y-3">
                    <StaggerItem>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">50% Needs</span>
                        <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(needs, data.currency)}</span>
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">25% Wants</span>
                        <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(wants, data.currency)}</span>
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">15% Savings</span>
                        <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(savings, data.currency)}</span>
                      </div>
                    </StaggerItem>
                    <StaggerItem>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">10% Giving</span>
                        <span className="font-black text-emerald-500 dark:text-emerald-400 text-base">{formatCurrency(giving, data.currency)}</span>
                      </div>
                    </StaggerItem>
                  </StaggerContainer>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.button>

      {/* Manual option */}
      <motion.button
        type="button"
        onClick={() => updateData({ budgetChoice: 'manual' })}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        aria-pressed={isManual}
        className="relative w-full text-left outline-none"
      >
        <div
          className={`relative overflow-hidden rounded-[2.2rem] border p-6 transition-colors duration-500 ${
            isManual
              ? 'border-emerald-500/50 bg-emerald-500/[0.04] shadow-[0_20px_40px_-12px_rgba(16,185,129,0.12)] dark:border-emerald-500/30 dark:bg-emerald-500/[0.02]'
              : 'border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:shadow-none'
          }`}
        >
          <div className="relative flex items-start gap-4">
            <div className="relative h-12 w-12 shrink-0">
              {isManual && (
                <motion.div
                  layoutId="icon-active-bg"
                  className="absolute inset-0 rounded-2xl bg-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10"
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                />
              )}
              <div className={`relative flex h-full w-full items-center justify-center rounded-2xl transition-colors duration-500 ${
                isManual ? 'text-white' : 'text-slate-400 dark:text-slate-500'
              }`}>
                <Pencil className="h-5 w-5" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">I&apos;ll do it myself later</h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">Skip budget creation for now</p>
            </div>
          </div>
        </div>
      </motion.button>

      <Button onClick={onNext} fullWidth size="lg">
        Continue
      </Button>
    </div>
  );
}
