'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepBasicInfo from '@/components/onboarding/StepBasicInfo';
import StepIncome from '@/components/onboarding/StepIncome';
import StepBills from '@/components/onboarding/StepBills';
import StepComplete from '@/components/onboarding/StepComplete';
import type { OnboardingData } from '@/types';

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [data, setData] = useState<OnboardingData>({
    name: '',
    currency: 'AED',
    incomeType: 'salary',
    payDay: 1,
    income: 0,
    initialBalance: 0,
    goldGrams: 0,
    bills: [],
    budgetChoice: 'manual',
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
      case 5: return <StepComplete data={data} />;
      default: return null;
    }
  };

  const isMiddleStep = currentStep >= 2 && currentStep <= 4;
  const canContinue = currentStep === 2 ? data.name.trim() !== '' : currentStep === 3 ? data.income > 0 : true;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] dark:text-white pt-[var(--pt-safe)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col relative">
        {/* Top bar */}
        {currentStep > 1 && (
          <div className="px-6 pt-6 pb-4 space-y-4">
            <div className="flex h-8 items-center">
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
            </div>
            <ProgressBar value={(currentStep / TOTAL_STEPS) * 100} size="sm" colorMode="emerald" />
          </div>
        )}

        {/* Step content */}
        <div className={`flex-1 flex flex-col px-6 ${currentStep === 1 ? 'pb-0' : 'pb-32'} overflow-hidden`}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full h-full flex flex-col"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Persistent Action Footer for middle steps */}
        {isMiddleStep && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed inset-x-0 bottom-0 p-6 z-50 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent dark:from-[#020617] dark:via-[#020617] pt-12 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
          >
            <div className="max-w-md mx-auto space-y-4">
              <button 
                onClick={next} 
                disabled={!canContinue}
                className={`w-full py-5 rounded-[2.2rem] text-xl font-black transition-all shadow-2xl ${
                  canContinue 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:scale-[1.02] active:scale-95' 
                    : 'bg-slate-200 text-slate-400 dark:bg-white/5 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
              {currentStep === 4 && (
                <button type="button" onClick={next} className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white text-center">
                  Skip for now
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
