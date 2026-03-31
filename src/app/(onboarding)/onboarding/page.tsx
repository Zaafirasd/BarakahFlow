'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepBasicInfo from '@/components/onboarding/StepBasicInfo';
import StepIncome from '@/components/onboarding/StepIncome';
import StepBills from '@/components/onboarding/StepBills';
import StepBudget from '@/components/onboarding/StepBudget';
import StepZakat from '@/components/onboarding/StepZakat';
import StepComplete from '@/components/onboarding/StepComplete';
import type { OnboardingData } from '@/types';

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [data, setData] = useState<OnboardingData>({
    name: '',
    currency: 'AED',
    payDay: 1,
    income: 0,
    bills: [],
    budgetChoice: 'auto',
    zakatEnabled: false,
    zakatDate: null,
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const next = () => {
    setDirection(1);
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const back = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepWelcome onNext={next} />;
      case 2: return <StepBasicInfo data={data} updateData={updateData} onNext={next} />;
      case 3: return <StepIncome data={data} updateData={updateData} onNext={next} />;
      case 4: return <StepBills data={data} updateData={updateData} onNext={next} />;
      case 5: return <StepBudget data={data} updateData={updateData} onNext={next} />;
      case 6: return <StepZakat data={data} updateData={updateData} onNext={next} />;
      case 7: return <StepComplete data={data} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] dark:text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* Top bar */}
        <div className="px-6 pt-6 pb-4 space-y-4">
          <div className="flex h-8 items-center">
            {currentStep > 1 && (
              <button
                onClick={back}
                className="group flex items-center gap-2 text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
                aria-label="Go back"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-slate-200 dark:bg-white/5 dark:group-hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">Back</span>
              </button>
            )}
          </div>
          <ProgressBar value={(currentStep / TOTAL_STEPS) * 100} size="sm" colorMode="emerald" />
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
