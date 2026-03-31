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
    console.log('Final onboarding data:', data);
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

      const { error: userError } = await supabase.from('users').update({
        name: sanitizedName,
        primary_currency: data.currency,
        financial_month_start_day: data.payDay,
        monthly_income: validateAmount(data.income) || 0,
        zakat_enabled: data.zakatEnabled,
        zakat_anniversary_date: data.zakatDate || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);

      if (userError) {
        setError(`Failed to update profile: ${userError.message}`);
        return;
      }

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

      if (data.bills.length > 0) {
        const billRows = data.bills.map((bill) => ({
          user_id: userId,
          name: sanitizeText(bill.name, 50),
          amount: validateAmount(bill.amount) || 0,
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

      if (data.budgetChoice === 'auto' && data.income > 0) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_system', true)
          .eq('type', 'expense');

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
            const { error: budgetError } = await supabase.from('budgets').insert(budgetRows);
            if (budgetError) {
              setError(`Failed to set up budget: ${budgetError.message}`);
              return;
            }
          }
        }
      }

      // Track aggregate events anonymously
      trackEvent(METRICS.ONBOARDING_COMPLETED);
      if (data.zakatEnabled) trackEvent(METRICS.ZAKAT_ENABLED);
      if (data.budgetChoice === 'auto') trackEvent(METRICS.BUDGET_CREATED);
      if (data.bills.length > 0) trackEvent(METRICS.BILL_ADDED);

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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
          </div>
        </Card>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button onClick={handleSave} fullWidth size="lg" loading={loading}>
        Enter BarakaFlow
      </Button>
    </div>
  );
}
