'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateNextDueDate } from '@/lib/utils/getFinancialMonth';
import { sanitizeText, validateAmount } from '@/lib/utils/validation';
import ProgressBar from '@/components/ui/ProgressBar';
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepBasicInfo from '@/components/onboarding/StepBasicInfo';
import StepIncome from '@/components/onboarding/StepIncome';
import StepBills from '@/components/onboarding/StepBills';
import StepComplete from '@/components/onboarding/StepComplete';
import type { OnboardingData } from '@/types';

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleFinalSave = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated. Please sign in again.');
        return;
      }

      const userId = user.id;
      const sanitizedName = sanitizeText(data.name, 50);
      const validatedIncome = validateAmount(data.income) ?? 0;
      const validatedBalance = validateAmount(data.initialBalance) ?? 0;

      // 1. Update user profile
      const { error: userError } = await supabase.from('users').upsert({
        id: userId,
        email: user.email!,
        name: sanitizedName,
        primary_currency: data.currency,
        financial_month_start_day: 1, 
        monthly_income: validatedIncome,
        income_type: data.incomeType,
        zakat_enabled: false, 
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (userError) {
        setError(`Failed to update profile: ${userError.message}`);
        return;
      }

      // 2. Create/Update account 
      const { data: existingAccounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (!existingAccounts?.length) {
        const { error: accountError } = await supabase.from('accounts').insert({
          user_id: userId,
          name: 'Main Account',
          type: 'cash',
          currency: data.currency,
          opening_balance: validatedBalance,
        });

        if (accountError) {
          setError(`Failed to create account: ${accountError.message}`);
          return;
        }
      } else {
        await supabase.from('accounts')
          .update({ opening_balance: validatedBalance })
          .eq('user_id', userId)
          .eq('id', existingAccounts[0].id);
      }

      // 3. Save Bills
      if (data.bills.length > 0) {
        const billRows = data.bills.map((bill) => ({
          user_id: userId,
          name: sanitizeText(bill.name, 50),
          amount: validateAmount(bill.amount) ?? 0,
          due_day: bill.dueDay,
          frequency: bill.frequency,
          next_due_date: calculateNextDueDate(bill.dueDay, bill.frequency).toISOString().split('T')[0],
        }));

        const { error: billsError } = await supabase.from('bills').insert(billRows);
        if (billsError) {
          setError(`Failed to save bills: ${billsError.message}`);
          return;
        }
      }

      // 4. Mark Completed
      const { error: completeOnboardingError } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (completeOnboardingError) {
        setError(`Failed to complete: ${completeOnboardingError.message}`);
        return;
      }

      document.cookie = "bf_onboarding_done=true; path=/; max-age=31536000; SameSite=Lax";
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (currentStep === 5) {
      handleFinalSave();
      return;
    }
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
          <div className="px-6 pt-6 pb-4 flex items-center gap-4">
            <div className="flex h-8 items-center shrink-0">
              <button
                onClick={back}
                className="group flex items-center gap-2 text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white"
                aria-label="Go back"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors group-hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </button>
            </div>
            <div className="flex-1">
              <ProgressBar value={(currentStep / TOTAL_STEPS) * 100} size="sm" colorMode="emerald" />
            </div>
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

        {/* Persistent Action Footer for middle and final steps */}
        {[2, 3, 4, 5].includes(currentStep) && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed inset-x-0 bottom-0 p-6 z-50 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent dark:from-[#020617] dark:via-[#020617] pt-12 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
          >
            <div className="max-w-md mx-auto space-y-4">
              {error && (
                <div className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-500 text-center">
                  {error}
                </div>
              )}
              <button 
                onClick={next} 
                disabled={!canContinue || loading}
                className={`w-full py-5 rounded-[2.2rem] text-xl font-black transition-all shadow-2xl flex items-center justify-center gap-2 ${
                  (canContinue && !loading)
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:scale-[1.02] active:scale-95' 
                    : 'bg-slate-200 text-slate-400 dark:bg-white/5 cursor-not-allowed'
                }`}
              >
                {loading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                )}
                {currentStep === 5 ? 'Get Started' : 'Continue'}
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
