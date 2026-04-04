'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MoonStar } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import PageTransition from '@/components/ui/PageTransition';
import Toast from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { sanitizeText, validateAmount } from '@/lib/utils/validation';
import { calculateAccountsTotal, getNextAnniversary, isHaulComplete, getZakatStorageKey } from '@/lib/utils/zakat';
import { calculateZakat, calculateNisab, type ZakatInputs as NewZakatInputs } from '@/lib/zakat/calculations';
import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, DEFAULT_ZAKAT_AL_FITR_RATE_AED, type NisabBasis } from '@/lib/zakat/constants';
import type { Account, Category, Transaction, User } from '@/types';

type TransactionWithCategory = Transaction & { category?: Category | null };
type PaymentKind = 'mal' | 'fitr';
type ExpandableSection = 'cash' | 'gold' | 'investments' | 'receivables' | 'deductions' | null;

interface ZakatInputs {
  cashOnHand: number;
  goldValue: number;
  silverValue: number;
  investmentValue: number;
  sukukValue: number;
  loansGiven: number;
  otherReceivables: number;
  debtsDue: number;
  essentialExpenses: number;
}
 
interface StoredZakatCalculation {
  inputs: ZakatInputs;
  result: {
    totalAssets: number;
    totalDeductions: number;
    netZakatableWealth: number;
    nisabValue: number;
    isAboveNisab: boolean;
    zakatDue: number;
  };
  updatedAt: string;
}

function isStoredZakatCalculation(value: unknown): value is StoredZakatCalculation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredZakatCalculation>;
  return typeof candidate.updatedAt === 'string' && !!candidate.inputs && !!candidate.result;
}

const DEFAULT_INPUTS: ZakatInputs = {
  cashOnHand: 0,
  goldValue: 0,
  silverValue: 0,
  investmentValue: 0,
  sukukValue: 0,
  loansGiven: 0,
  otherReceivables: 0,
  debtsDue: 0,
  essentialExpenses: 0,
};

function ExpandableCard({
  title,
  subtitle,
  total,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  total: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76 overflow-hidden transition-all duration-300">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left p-1">
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">{title}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{total}</span>
          <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
             <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
          >
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-5 dark:border-white/5 p-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

interface PaymentFormState {
  amount: string;
  recipient: string;
  date: string;
  notes: string;
}

interface PaymentErrors {
  amount?: string;
  date?: string;
}

export default function ZakatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Array<Pick<Category, 'id' | 'name'>>>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<ExpandableSection>('cash');
  const [inputs, setInputs] = useState<ZakatInputs>(DEFAULT_INPUTS);
  const [goldPrice, setGoldPrice] = useState<number>(561.42);
  const [silverPrice, setSilverPrice] = useState<number>(8.75);
  const [nisabBasis, setNisabBasis] = useState<NisabBasis>('silver');
  const [storedCalculation, setStoredCalculation] = useState<StoredZakatCalculation | null>(null);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [paymentKind, setPaymentKind] = useState<PaymentKind>('mal');
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    amount: '',
    recipient: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({});
  const [familyCount, setFamilyCount] = useState('1');
  const [fitrRate, setFitrRate] = useState<string>(String(DEFAULT_ZAKAT_AL_FITR_RATE_AED));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' }>({
    message: '',
    tone: 'success',
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (toast.message) {
        setToast((current) => ({ ...current, message: '' }));
      }
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast.message]);

  const loadPage = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return;
    }

    const [profileResult, accountsResult, categoriesResult, transactionsResult, goldRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('accounts').select('*').eq('user_id', authUser.id).eq('is_active', true),
      supabase
        .from('categories')
        .select('id, name')
        .or(`user_id.eq.${authUser.id},user_id.is.null`)
        .in('name', ['Zakat Al-Mal', 'Zakat Al-Fitr'])
        .eq('type', 'expense'),
      supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', authUser.id)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500),
      fetch('/api/gold-price').catch(() => null),
    ]);

    if (profileResult.data) {
      const profile = profileResult.data as User;
      setUser(profile);

      if (profile.zakat_fitr_rate_per_person) {
        setFitrRate(String(profile.zakat_fitr_rate_per_person));
      }

      if (isStoredZakatCalculation(profile.zakat_inputs)) {
        const stored = profile.zakat_inputs as StoredZakatCalculation;
        setStoredCalculation(stored);
        setInputs(stored.inputs);
      } else {
        if (typeof window !== 'undefined') {
          const storedLocal = window.localStorage.getItem(getZakatStorageKey(profile.id));
          if (storedLocal) {
            try {
              const parsed = JSON.parse(storedLocal) as unknown;
              if (isStoredZakatCalculation(parsed)) {
                setStoredCalculation(parsed);
                setInputs(parsed.inputs);
              }
            } catch {
              // Ignore malformed local backup data.
            }
          }
        }
      }
    }

    setAccounts((accountsResult.data || []) as Account[]);
    setCategories((categoriesResult.data || []) as Array<Pick<Category, 'id' | 'name'>>);
    setTransactions((transactionsResult.data || []) as TransactionWithCategory[]);
    setAccountId(accountsResult.data?.[0]?.id || null);

    if (goldRes?.ok) {
      try {
        const metalData = await goldRes.json() as { price_per_gram_gold?: number; price_per_gram_silver?: number };
        if (metalData.price_per_gram_gold) {
          setGoldPrice(metalData.price_per_gram_gold);
        }
        if (metalData.price_per_gram_silver) {
          setSilverPrice(metalData.price_per_gram_silver);
        }
      } catch { /* fallback already set */ }
    }

    setLoading(false);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadPage();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const currency = user?.primary_currency || 'AED';
  const cashAndBankBalance = useMemo(() => calculateAccountsTotal(accounts, transactions), [accounts, transactions]);
  
  const currentMetalPrice = nisabBasis === 'gold' ? goldPrice : silverPrice;
  const nisabValue = useMemo(() => calculateNisab(currentMetalPrice, nisabBasis), [currentMetalPrice, nisabBasis]);

  const calculatedResult = useMemo(() => {
    const calculationInputs: NewZakatInputs = {
      cash: inputs.cashOnHand,
      bankBalances: cashAndBankBalance,
      goldValue: inputs.goldValue,
      silverValue: inputs.silverValue,
      investmentsValue: inputs.investmentValue + inputs.sukukValue,
      receivablesLikelyToBePaid: inputs.loansGiven + inputs.otherReceivables,
      shortTermDebts: inputs.debtsDue,
      immediateBillsDue: inputs.essentialExpenses,
      nisabValue,
      nisabBasis,
    };
    return calculateZakat(calculationInputs);
  }, [cashAndBankBalance, inputs, nisabValue, nisabBasis]);

  const nextAnniversary = useMemo(() => getNextAnniversary(user?.zakat_anniversary_date || null), [user?.zakat_anniversary_date]);
  const isHaulDue = useMemo(() => isHaulComplete(user?.zakat_anniversary_date || null), [user?.zakat_anniversary_date]);
  
  const paymentHistory = useMemo(
    () =>
      transactions.filter((transaction) => {
        const name = transaction.category?.name;
        return name === 'Zakat Al-Mal' || name === 'Zakat Al-Fitr';
      }),
    [transactions]
  );

  const totalPaidThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return paymentHistory.reduce((sum, transaction) => {
      const transactionYear = new Date(transaction.date).getFullYear();
      return transactionYear === currentYear ? sum + Math.abs(Number(transaction.amount)) : sum;
    }, 0);
  }, [paymentHistory]);

  const fitrTotal = Math.max(Number(familyCount) || 0, 0) * (Number(fitrRate) || DEFAULT_ZAKAT_AL_FITR_RATE_AED);

  const setInput = (field: keyof ZakatInputs, value: string) => {
    const parsed = Number(value);
    setInputs((current) => ({
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const handleCalculate = async () => {
    if (!user) return;

    setSaving(true);
    const payload: StoredZakatCalculation = {
      inputs,
      result: calculatedResult,
      updatedAt: new Date().toISOString(),
    };

    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ zakat_inputs: payload })
      .eq('id', user.id);

    setSaving(false);
    
    if (error) {
       setToast({ message: 'Cloud sync failed, saving locally', tone: 'error' });
       if (typeof window !== 'undefined') {
         window.localStorage.setItem(getZakatStorageKey(user.id), JSON.stringify(payload));
       }
     } else {
       setToast({ message: calculatedResult.isAboveNisab ? 'Zakat estimate synced' : 'Calculation saved to cloud', tone: 'success' });
     }
    
    setStoredCalculation(payload);
  };

  const openPaymentSheet = (kind: PaymentKind) => {
    // If logging Zakat Al-Mal but Haul is not complete/due, warn the user.
    if (kind === 'mal' && !isHaulDue && calculatedResult.isAboveNisab) {
      if (!window.confirm('Your Zakat anniversary has not yet been reached. Would you like to log this as an advance payment?')) {
        return;
      }
    }

    setPaymentKind(kind);
    setPaymentForm({
      amount: kind === 'mal' ? String(storedCalculation?.result.zakatDue || calculatedResult.zakatDue || 0) : String(fitrTotal),
      recipient: '',
      date: new Date().toISOString().split('T')[0],
      notes: kind === 'mal' && !isHaulDue ? 'Advance Zakat Payment' : '',
    });
    setPaymentErrors({});
    setPaymentSheetOpen(true);
  };

  const validatePaymentForm = (): boolean => {
    const errors: PaymentErrors = {};
    const parsed = Number(paymentForm.amount);
    
    if (!paymentForm.amount || isNaN(parsed) || parsed <= 0) {
      errors.amount = 'Enter a valid amount > 0';
    }
    
    if (!paymentForm.date) {
      errors.date = 'Date is required';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogPayment = async () => {
    if (!user || !accountId) {
      setToast({ message: 'Add an account before logging payments', tone: 'error' });
      return;
    }

    if (!validatePaymentForm()) return;

    const parsedAmount = Number(paymentForm.amount);
    const categoryName = paymentKind === 'mal' ? 'Zakat Al-Mal' : 'Zakat Al-Fitr';
    const category = categories.find((entry) => entry.name === categoryName);

    if (!category) {
      setToast({ message: `Missing ${categoryName} category`, tone: 'error' });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const result = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: accountId,
      category_id: category.id,
      amount: -Math.abs(parsedAmount),
      merchant_name: sanitizeText(paymentForm.recipient, 80) || categoryName,
      description: sanitizeText(paymentForm.notes, 200) || null,
      date: paymentForm.date,
      type: 'expense',
      zakat_fitr_meta: paymentKind === 'fitr' ? {
        familyMemberCount: Number(familyCount),
        ratePerPerson: Number(fitrRate),
        currency: currency,
        source: 'user_confirmed'
      } : null,
    });
    setSaving(false);

    if (result.error) {
      setToast({ message: result.error.message, tone: 'error' });
      return;
    }

    setPaymentSheetOpen(false);
    setToast({
      message:
        paymentKind === 'mal'
          ? `Zakat payment of ${formatCurrency(parsedAmount, currency)} logged. Barakallahu feek.`
          : `Zakat Al-Fitr payment of ${formatCurrency(parsedAmount, currency)} logged.`,
      tone: 'success',
    });
    await loadPage();
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
        <div className="h-40 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
        <div className="h-36 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
      </div>
    );
  }

  if (!user?.zakat_enabled) {
    return (
      <PageTransition>
        <div className="relative min-h-screen px-5 pb-28 pt-[var(--pt-safe)]">
          <div className="top-glow" />
          <PageHeader title="Zakat" subtitle="Enable Zakat tracking in your profile to use this page." />
          <Card className="border border-white/70 bg-white/82 py-12 text-center dark:border-white/10 dark:bg-slate-900/76 rounded-[2.5rem] shadow-xl">
            <div className="flex justify-center mb-6">
               <div className="w-20 h-20 rounded-full bg-emerald-500/5 flex items-center justify-center animate-bounce">
                  <MoonStar className="w-10 h-10 text-emerald-500" />
               </div>
            </div>
            <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Zakat tracking is disabled.</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 px-8">Enable it in your Profile to calculate and log Zakat payments.</p>
            <div className="mt-8">
              <Button onClick={() => (window.location.href = '/profile')} className="rounded-3xl px-8 py-4 text-base font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                Enable in Profile
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen px-5 pb-32 pt-[var(--pt-safe)]">
        <div className="top-glow" />
        <PageHeader title="Zakat" subtitle="Track your Zakat Al-Mal and manage Al-Fitr payments securely in the cloud." />

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-6"
        >
          <Card className="relative overflow-hidden border border-emerald-500/10 bg-white/82 dark:bg-slate-900/76 rounded-[2rem] shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <MoonStar className="w-24 h-24" />
            </div>
            <div className="flex items-start gap-5 p-1">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 shadow-inner shadow-emerald-500/5">
                <MoonStar className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500/60 leading-none">Zakat Al-Mal Estimate</p>
                <p className="mt-3 text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                  {formatCurrency(storedCalculation?.result.zakatDue ?? calculatedResult.zakatDue, currency)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                   <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-500">
                      {!user.zakat_anniversary_date ? 'Set Anniversary in Profile' : (isHaulDue ? 'Haul Complete' : `${nextAnniversary?.daysUntil} days left`)}
                   </div>
                   {calculatedResult.isAboveNisab && isHaulDue && (
                     <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
                        Eligible Now
                     </div>
                   )}
                   {calculatedResult.isAboveNisab && !isHaulDue && user.zakat_anniversary_date && (
                     <div className="px-3 py-1.5 rounded-full bg-amber-500/10 text-[11px] font-bold text-amber-500 border border-amber-500/20">
                        Haul Incomplete
                     </div>
                   )}
                   {storedCalculation && (
                     <div className="px-3 py-1.5 rounded-full bg-emerald-500/5 text-[11px] font-bold text-emerald-500 border border-emerald-500/10">
                        Cloud Synced
                     </div>
                   )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
               <Button onClick={handleCalculate} loading={saving} fullWidth className="rounded-[1.4rem] py-4 text-sm font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none shadow-xl">
                  {storedCalculation ? 'Update Cloud Calc' : 'Start Calculation'}
               </Button>
            </div>
          </Card>

          {/* Nisab Basis Toggle */}
          <Card className="border border-white/70 bg-white/82 p-4 dark:border-white/10 dark:bg-slate-900/76 rounded-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Nisab Basis</p>
                <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                  Using {nisabBasis === 'gold' ? 'Gold (85g)' : 'Silver (612.36g)'}
                </p>
              </div>
              <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
                <button
                  onClick={() => setNisabBasis('silver')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${nisabBasis === 'silver' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Silver
                </button>
                <button
                  onClick={() => setNisabBasis('gold')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${nisabBasis === 'gold' ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Gold
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-medium text-slate-500">
              <span>Current {nisabBasis === 'gold' ? 'Gold' : 'Silver'} Price</span>
              <span className="font-bold">{formatCurrency(currentMetalPrice, currency)}/g</span>
            </div>
          </Card>

          <Card className="border border-white/70 bg-white/82 p-6 dark:border-white/10 dark:bg-slate-900/76 rounded-[2rem] shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Zakat Al-Fitr</p>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{formatCurrency(fitrTotal, currency)}</p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 italic opacity-80">
                  Local estimate. Please confirm with your authority.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-20">
                  <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Rate</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={fitrRate}
                    onChange={(event) => setFitrRate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="w-20">
                  <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Family</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={familyCount}
                    onChange={(event) => setFamilyCount(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Button fullWidth onClick={() => openPaymentSheet('fitr')} className="rounded-[1.4rem] py-4 text-sm font-bold">
                Log Fitr Payment
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <ExpandableCard
              title="Cash & Bank Balances"
              subtitle="BarakahFlow balance + physical cash."
              total={formatCurrency(cashAndBankBalance + inputs.cashOnHand, currency)}
              isOpen={expandedSection === 'cash'}
              onToggle={() => setExpandedSection((current) => (current === 'cash' ? null : 'cash'))}
            >
              <div className="rounded-[1.5rem] bg-slate-50 px-5 py-5 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Auto-populated balance</p>
                <p className="mt-2 text-xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(cashAndBankBalance, currency)}</p>
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-bold text-slate-400 ml-4">Additional Cash</label>
                 <input
                  type="number"
                  inputMode="decimal"
                  value={inputs.cashOnHand || ''}
                  onChange={(event) => setInput('cashOnHand', event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                />
              </div>
            </ExpandableCard>

            <ExpandableCard
              title="Gold & Silver"
              subtitle="Personal jewelry or investment metals."
              total={formatCurrency(inputs.goldValue + inputs.silverValue, currency)}
              isOpen={expandedSection === 'gold'}
              onToggle={() => setExpandedSection((current) => (current === 'gold' ? null : 'gold'))}
            >
              <div className="grid gap-4">
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 ml-4">Gold Value</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputs.goldValue || ''}
                      onChange={(event) => setInput('goldValue', event.target.value)}
                      className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 ml-4">Silver Value</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputs.silverValue || ''}
                      onChange={(event) => setInput('silverValue', event.target.value)}
                      className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                    />
                 </div>
              </div>
            </ExpandableCard>

            <ExpandableCard
              title="Investments"
              subtitle="Halal stocks, Sukuk, and funds."
              total={formatCurrency(inputs.investmentValue + inputs.sukukValue, currency)}
              isOpen={expandedSection === 'investments'}
              onToggle={() => setExpandedSection((current) => (current === 'investments' ? null : 'investments'))}
            >
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 ml-4">Halal Stocks / Funds</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inputs.investmentValue || ''}
                    onChange={(event) => setInput('investmentValue', event.target.value)}
                    className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 ml-4">Sukuk</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inputs.sukukValue || ''}
                    onChange={(event) => setInput('sukukValue', event.target.value)}
                    className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard
              title="Receivables"
              subtitle="Loans you expect back and other receivables."
              total={formatCurrency(inputs.loansGiven + inputs.otherReceivables, currency)}
              isOpen={expandedSection === 'receivables'}
              onToggle={() => setExpandedSection((current) => (current === 'receivables' ? null : 'receivables'))}
            >
              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 ml-4">Loans Given</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inputs.loansGiven || ''}
                    onChange={(event) => setInput('loansGiven', event.target.value)}
                    className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 ml-4">Other Receivables</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={inputs.otherReceivables || ''}
                    onChange={(event) => setInput('otherReceivables', event.target.value)}
                    className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                </div>
              </div>
            </ExpandableCard>

            <ExpandableCard
              title="Deductions"
              subtitle="Debts or essential expenses due now."
              total={formatCurrency(inputs.debtsDue + inputs.essentialExpenses, currency)}
              isOpen={expandedSection === 'deductions'}
              onToggle={() => setExpandedSection((current) => (current === 'deductions' ? null : 'deductions'))}
            >
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 ml-4">Short-term Debt</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputs.debtsDue || ''}
                      onChange={(event) => setInput('debtsDue', event.target.value)}
                      className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 ml-4">Essential Expenses Due</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputs.essentialExpenses || ''}
                      onChange={(event) => setInput('essentialExpenses', event.target.value)}
                      className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                    />
                 </div>
              </div>
            </ExpandableCard>
          </div>

          <Card className="border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76 p-6 rounded-[2.2rem] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Wealth Summary</p>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                 <span className="font-bold text-slate-500">Gross Wealth</span>
                 <span className="font-black text-slate-900 dark:text-white text-base">{formatCurrency(calculatedResult.netZakatableWealth + (calculatedResult.totalDeductions || 0), currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Nisab Threshold</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {formatCurrency(nisabValue, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <span className="font-bold text-slate-500">Cloud Deductions</span>
                <span className="font-black text-rose-500 text-base">-{formatCurrency(calculatedResult.totalDeductions, currency)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-slate-900 dark:text-white text-base">Net Zakatable</span>
                <span className="font-black text-emerald-500 text-lg tracking-tighter">{formatCurrency(calculatedResult.netZakatableWealth, currency)}</span>
              </div>
            </div>

            <div className={`mt-6 rounded-[1.8rem] border-2 px-5 py-5 transition-all duration-500 ${calculatedResult.isAboveNisab ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-100 bg-slate-50 dark:bg-white/5 dark:border-white/5'}`}>
              {calculatedResult.isAboveNisab ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Mandatory Zakat Due</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(calculatedResult.zakatDue, currency)}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">(Calculated at 2.5%)</p>
                  <div className="mt-6">
                    <Button onClick={() => openPaymentSheet('mal')} className="rounded-2xl px-6 py-4 text-sm font-bold bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/30">
                      Log Zakat Now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Below Nisab Threshold</p>
                  <p className="mt-1 text-xs font-medium text-slate-500 px-4">
                    Your wealth is below the {nisabBasis} Nisab ({formatCurrency(nisabValue, currency)}). No Zakat is due at this time.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76 p-6 rounded-[2rem]">
            <div className="mb-5 flex items-center justify-between gap-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Payment History</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                {formatCurrency(totalPaidThisYear, currency)} this year
              </span>
            </div>
            {paymentHistory.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-white/10">
                 <p className="text-sm font-bold text-slate-400">No records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-[1.4rem] bg-white border border-slate-100 p-4 dark:bg-white/5 dark:border-white/5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white leading-none">{transaction.merchant_name || transaction.category?.name}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(Math.abs(Number(transaction.amount)), currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <BottomSheet
          isOpen={paymentSheetOpen}
          onClose={() => setPaymentSheetOpen(false)}
          title={paymentKind === 'mal' ? 'Log Zakat' : 'Log Fitr'}
          footer={
            <Button fullWidth onClick={handleLogPayment} loading={saving} className="rounded-3xl py-5 text-base font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none shadow-2xl">
              Confirm & Save
            </Button>
          }
        >
          <div className="space-y-5 pb-8">
            <div className="space-y-1.5">
               <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Payment Amount</label>
               <div className="relative">
                 <input
                    type="number"
                    inputMode="decimal"
                    value={paymentForm.amount}
                    onChange={(event) => {
                      const parsedAmount = validateAmount(event.target.value);
                      setPaymentForm((current) => ({ ...current, amount: event.target.value }));
                      setPaymentErrors((prev) => ({
                        ...prev,
                        amount: parsedAmount === null || parsedAmount <= 0 ? 'Enter a valid amount > 0' : undefined,
                      }));
                    }}
                    className={`w-full rounded-[1.5rem] border ${paymentErrors.amount ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
                    placeholder="0.00"
                  />
                  {paymentErrors.amount && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{paymentErrors.amount}</p>}
               </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Recipient</label>
                <input
                  type="text"
                  value={paymentForm.recipient}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, recipient: sanitizeText(event.target.value, 80) }))}
                  placeholder="Mosque / Charity"
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Date of Payment</label>
                <div className="relative">
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(event) => { setPaymentForm((current) => ({ ...current, date: event.target.value })); setPaymentErrors(prev => ({ ...prev, date: undefined })); }}
                    className={`w-full rounded-[1.5rem] border ${paymentErrors.date ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
                  />
                  {paymentErrors.date && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{paymentErrors.date}</p>}
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Internal Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, notes: sanitizeText(event.target.value, 200) }))}
                  placeholder="Any details to remember..."
                  className="min-h-24 w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white resize-none"
                />
            </div>
          </div>
        </BottomSheet>

        <Toast message={toast.message} tone={toast.tone} />
      </div>
    </PageTransition>
  );
}
