'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateNextDueDate, formatDayLabel } from '@/lib/utils/getFinancialMonth';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { sanitizeText, validateAmount } from '@/lib/utils/validation';
import { trackEvent, METRICS } from '@/lib/utils/analytics';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { OnboardingData } from '@/types';

interface StepCompleteProps {
  data: OnboardingData;
}

export default function StepComplete({ data }: StepCompleteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
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
        financial_month_start_day: 1, // Default to 1st sinceเรา removed the selector
        monthly_income: validatedIncome,
        income_type: data.incomeType,
        zakat_enabled: false, // Disabled for now, add in menu later
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (userError) {
        setError(`Failed to update profile: ${userError.message}`);
        return;
      }

      // 2. Create/Update account with initial balance
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
        // Update existing account's opening balance
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

      // 4. Mark Onboarding as Completed
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

  const symbol = formatCurrency(0, data.currency).replace(/[0.,\s]/g, '');

  return (
    <div className="space-y-10 py-4 flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative"
      >
         <div className="absolute inset-0 blur-3xl bg-emerald-500/20 rounded-full" />
         <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-white/5 border-4 border-emerald-500 shadow-2xl shadow-emerald-500/20">
           <CheckCircle2 className="h-12 w-12 text-emerald-500" />
         </div>
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-[2.2rem] font-extrabold tracking-tight text-slate-900 dark:text-white Montserrat leading-tight">You&apos;re all set!</h2>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 tracking-tight">BarakahFlow is ready for your first entry.</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-3 pb-4">
        {/* Name Chip */}
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-5 transition-all hover:scale-[1.02]">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">User</span>
           <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-full">{data.name}</span>
        </div>

        {/* Currency Chip */}
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-5 transition-all hover:scale-[1.02]">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Currency</span>
           <span className="text-sm font-black text-slate-900 dark:text-white uppercase">{data.currency}</span>
        </div>

        {/* Balance Chip */}
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-5 transition-all hover:scale-[1.02]">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Starting Balance</span>
           <span className="text-sm font-black text-emerald-500">{symbol} {data.initialBalance.toLocaleString()}</span>
        </div>

        {/* Income Chip */}
        <div className="flex flex-col items-center justify-center rounded-[1.8rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-5 transition-all hover:scale-[1.02]">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Income</span>
           <span className="text-sm font-black text-slate-900 dark:text-white">{symbol} {data.income.toLocaleString()}</span>
        </div>

        {/* Bills Chip */}
        <div className="col-span-2 flex items-center justify-between rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 p-5 px-8 transition-all hover:scale-[1.02]">
           <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/70 mb-1">Active Bills</span>
             <span className="text-sm font-black text-indigo-600 dark:text-white uppercase">{data.bills.length} Tracking</span>
           </div>
           <div className="flex -space-x-2">
             {data.bills.slice(0, 3).map((_, i) => (
               <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-[#020617] bg-indigo-500 flex items-center justify-center">
                 <span className="text-[10px] text-white font-black">B</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      {error && (
        <div className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-500 text-center">
          {error}
        </div>
      )}

      <div className="w-full pt-4">
        <Button onClick={handleSave} fullWidth size="lg" loading={loading} className="rounded-[2.2rem] py-6 text-xl font-black shadow-2xl shadow-emerald-500/25">
          Get Started
        </Button>
      </div>
    </div>
  );
}
