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
      const validatedGoldGrams = validateAmount(data.goldGrams) ?? 0;

      const { error: userError } = await supabase.from('users').upsert({
        id: userId,
        email: user.email!,
        name: sanitizedName,
        primary_currency: data.currency,
        financial_month_start_day: data.payDay,
        monthly_income: validatedIncome,
        income_type: data.incomeType,
        zakat_enabled: data.zakatEnabled,
        zakat_anniversary_date: data.zakatDate || null,
        gold_grams: validatedGoldGrams,
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (userError) {
        setError(`Failed to update profile: ${userError.message}`);
        return;
      }

      const { data: existingAccounts, error: accountLookupError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (accountLookupError) {
        setError(`Failed to check accounts: ${accountLookupError.message}`);
        return;
      }

      if (!existingAccounts?.length) {
        const { error: accountError } = await supabase.from('accounts').insert({
          user_id: userId,
          name: 'Main Account',
          type: 'cash',
          currency: data.currency,
          opening_balance: 0,
        });

        if (accountError) {
          setError(`Failed to create account: ${accountError.message}`);
          return;
        }
      }

      if (data.bills.length > 0) {
        const { data: existingBills, error: existingBillsError } = await supabase
          .from('bills')
          .select('name, amount, due_day, frequency')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (existingBillsError) {
          setError(`Failed to check existing bills: ${existingBillsError.message}`);
          return;
        }

        const existingBillKeys = new Set(
          (existingBills ?? []).map((bill) => `${bill.name}|${Number(bill.amount)}|${bill.due_day}|${bill.frequency}`)
        );

        const billRows = data.bills
          .map((bill) => {
            const amount = validateAmount(bill.amount);

            if (amount === null || amount <= 0) {
              return null;
            }

            return {
              user_id: userId,
              name: sanitizeText(bill.name, 50),
              amount,
              due_day: bill.dueDay,
              frequency: bill.frequency,
              next_due_date: calculateNextDueDate(bill.dueDay, bill.frequency).toISOString().split('T')[0],
            };
          })
          .filter((bill): bill is NonNullable<typeof bill> => {
            if (!bill) {
              return false;
            }

            const key = `${bill.name}|${Number(bill.amount)}|${bill.due_day}|${bill.frequency}`;
            return !existingBillKeys.has(key);
          });

        if (billRows.length > 0) {
          const { error: billsError } = await supabase.from('bills').insert(billRows);
          if (billsError) {
            setError(`Failed to save bills: ${billsError.message}`);
            return;
          }
        }
      }

      if (data.budgetChoice === 'auto' && data.income > 0) {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_system', true)
          .eq('type', 'expense');

        if (categoriesError) {
          setError(`Failed to load categories: ${categoriesError.message}`);
          return;
        }

        if (categories) {
          const needsCategories = ['housing', 'utilities', 'groceries & food', 'transportation', 'healthcare'];
          const wantsCategories = ['dining out', 'entertainment', 'clothing', 'subscriptions'];
          const givingCategories = ['zakat al-mal', 'sadaqah'];

          const needsBudget = (data.income * 0.5) / needsCategories.length;
          const wantsBudget = (data.income * 0.25) / wantsCategories.length;
          const givingBudget = (data.income * 0.1) / givingCategories.length;

          const budgetRows: { user_id: string; category_id: string; amount: number }[] = [];

          categories.forEach((cat) => {
            const catNameLower = cat.name.toLowerCase();
            if (needsCategories.includes(catNameLower)) {
              budgetRows.push({ user_id: userId, category_id: cat.id, amount: needsBudget });
            } else if (wantsCategories.includes(catNameLower)) {
              budgetRows.push({ user_id: userId, category_id: cat.id, amount: wantsBudget });
            } else if (givingCategories.includes(catNameLower)) {
              budgetRows.push({ user_id: userId, category_id: cat.id, amount: givingBudget });
            }
          });

          if (budgetRows.length > 0) {
            const { error: budgetError } = await supabase
              .from('budgets')
              .upsert(budgetRows, { onConflict: 'user_id,category_id' });

            if (budgetError) {
              setError(`Failed to set up budget: ${budgetError.message}`);
              return;
            }
          }
        }
      }

      const { error: completeOnboardingError } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (completeOnboardingError) {
        setError(`Failed to complete onboarding: ${completeOnboardingError.message}`);
        return;
      }

      // Track aggregate events anonymously
      if (data.bills.length > 0) trackEvent(METRICS.BILL_ADDED);
      
      // OPTIMIZATION: Set onboarding completion cookie for FAST middleware checks (fixes the 5s delay)
      document.cookie = "bf_onboarding_done=true; path=/; max-age=31536000; SameSite=Lax";
      
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">You&apos;re all set!</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Here&apos;s a summary of your setup</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Name</span>
              <span className="font-medium text-slate-900 dark:text-white">{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Currency</span>
              <span className="font-medium text-slate-900 dark:text-white">{data.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Income</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(data.income, data.currency)} /month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Pay Day</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatDayLabel(data.payDay)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Bills</span>
              <span className="font-medium text-slate-900 dark:text-white">{data.bills.length} bills tracked</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Budget</span>
              <span className="font-medium text-slate-900 dark:text-white">{data.budgetChoice === 'auto' ? 'Auto' : 'Manual later'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Zakat</span>
              <span className="font-medium text-slate-900 dark:text-white">{data.zakatEnabled ? 'On' : 'Off'}</span>
            </div>
            {data.zakatEnabled && data.goldGrams > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gold Holding</span>
                <span className="font-medium text-slate-900 dark:text-white">{data.goldGrams}g</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button onClick={handleSave} fullWidth size="lg" loading={loading}>
        Enter BarakahFlow
      </Button>
    </div>
  );
}
