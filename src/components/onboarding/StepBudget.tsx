'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
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

  const renderOption = ({
    selected,
    onClick,
    icon,
    title,
    description,
    badge,
    children,
  }: {
    selected: boolean;
    onClick: () => void;
    icon: ReactNode;
    title: string;
    description?: string;
    badge?: string;
    children?: ReactNode;
  }) => (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      aria-pressed={selected}
      className="relative w-full text-left"
    >
      {selected ? (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0.45, scale: 0.98 }}
          animate={{ opacity: [0.42, 0.72, 0.42], scale: [0.99, 1.01, 0.99] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-1 rounded-[2rem] bg-emerald-400/18 blur-xl"
        />
      ) : null}

      <div
        className={`relative rounded-[2rem] border p-5 backdrop-blur-xl transition-all duration-200 ${
          selected
            ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(52,211,153,0.24),0_0_28px_rgba(16,185,129,0.22),0_18px_44px_rgba(16,185,129,0.18)]'
            : 'border-white/70 bg-white/82 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-lg p-2 ${
              selected ? 'bg-emerald-500/14 text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
            }`}
          >
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
              {badge ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">{badge}</span>
              ) : null}
            </div>
            {description ? <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
            {children}
          </div>
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Budget plan</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">How do you want to budget?</p>
      </div>

      {renderOption({
        selected: data.budgetChoice === 'auto',
        onClick: () => updateData({ budgetChoice: 'auto' }),
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Set it up for me',
        badge: 'Recommended',
        children:
          data.budgetChoice === 'auto' && income > 0 ? (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">50% Needs</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(needs, data.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">25% Wants</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(wants, data.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">15% Savings</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(savings, data.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-500 dark:text-emerald-400">10% Giving</span>
                <span className="font-medium text-emerald-500 dark:text-emerald-400">{formatCurrency(giving, data.currency)}</span>
              </div>
            </div>
          ) : null,
      })}

      {renderOption({
        selected: data.budgetChoice === 'manual',
        onClick: () => updateData({ budgetChoice: 'manual' }),
        icon: <Pencil className="h-5 w-5" />,
        title: "I'll do it myself later",
        description: 'Skip budget creation for now',
      })}

      <Button onClick={onNext} fullWidth size="lg">
        Continue
      </Button>
    </div>
  );
}
