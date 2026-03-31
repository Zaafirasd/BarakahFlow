'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      layout
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      aria-pressed={selected}
      className="relative w-full text-left outline-none"
    >
      <motion.div
        layout
        className={`relative overflow-hidden rounded-[2.2rem] border p-6 transition-all duration-500 ease-out ${
          selected
            ? 'border-emerald-500/50 bg-emerald-500/[0.03] shadow-[0_20px_40px_-12px_rgba(16,185,129,0.12)] dark:border-emerald-500/30 dark:bg-emerald-500/[0.02]'
            : 'border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:shadow-none'
        }`}
      >
        {selected && (
          <motion.div
            layoutId="highlight"
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}
        
        <div className="relative flex items-start gap-4">
          <motion.div
            layout
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${
              selected 
                ? 'bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10' 
                : 'bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-slate-500'
            }`}
          >
            {icon}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <motion.h3 layout="position" className="text-lg font-black tracking-tight text-slate-900 dark:text-white Montserrat">{title}</motion.h3>
              {badge && (
                <motion.span 
                  layout="position"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
                >
                  {badge}
                </motion.span>
              )}
            </div>
            {description && <motion.p layout="position" className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{description}</motion.p>}
            <AnimatePresence mode="wait">
              {children && (
                <motion.div
                  key="budget-details"
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                    {children}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
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
