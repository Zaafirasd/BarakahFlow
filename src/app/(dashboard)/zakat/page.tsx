'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import PageTransition from '@/components/ui/PageTransition';
import Toast from '@/components/ui/Toast';
import { ChevronDown, Info, ShieldCheck, Calculator, Save, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { type User } from '@supabase/supabase-js';

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 dark:border-white/10 dark:bg-slate-900/60 shadow-sm backdrop-blur-md transition-all">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 focus:outline-none"
      >
        <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h3>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="border-t border-slate-100 px-6 pb-6 pt-2 dark:border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ZakatPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);
  
  // Silver Nisab
  const [silverPricePerGram, setSilverPricePerGram] = useState<number>(3.34); // Defaults approx AED 3.34
  
  // Assets
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [goldWeight, setGoldWeight] = useState<number>(0);
  const [goldKarat, setGoldKarat] = useState<number>(24);
  const [goldPricePerGram, setGoldPricePerGram] = useState<number>(300); // Default approx AED 300
  
  const [silverWeight, setSilverWeight] = useState<number>(0);
  // Re-uses silverPricePerGram
  
  const [moneyOwed, setMoneyOwed] = useState<number>(0);
  const [businessInventory, setBusinessInventory] = useState<number>(0);
  
  // Salary Option
  const [includeSalary, setIncludeSalary] = useState<boolean>(false);
  
  // Hawl Check
  const [hawlPassed, setHawlPassed] = useState<boolean>(false);
  
  // Accordion state
  const [openSection, setOpenSection] = useState<string | null>('cash');
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' }>({ message: '', tone: 'success' });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (toast.message) {
        setToast((current) => ({ ...current, message: '' }));
      }
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [toast.message]);

  // Initial fetch for balance if available (Step 3: Connect to App Data)
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      const supabase = createClient();
      const [accountsRes, txnsRes] = await Promise.all([
        supabase.from('accounts').select('opening_balance').eq('user_id', user.id).eq('is_active', true),
        supabase.from('transactions').select('amount').eq('user_id', user.id).is('deleted_at', null)
      ]);
      
      let opening = accountsRes.data?.reduce((sum, a) => sum + Number(a.opening_balance || 0), 0) || 0;
      let txns = txnsRes.data?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;
      
      const total = opening + txns;
      if (total > 0) {
        setCashBalance(total);
      }
    };
    fetchBalance();
  }, [user]);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  // Calculations
  const nisabValue = 595 * silverPricePerGram;
  
  const goldValue = (goldWeight * (goldKarat / 24)) * goldPricePerGram;
  const silverAssetValue = silverWeight * silverPricePerGram;
  
  const totalWealth = cashBalance + goldValue + silverAssetValue + moneyOwed + businessInventory;
  
  const isNisabMet = totalWealth >= nisabValue;
  const isZakatDue = isNisabMet && hawlPassed;
  const zakatAmount = isZakatDue ? totalWealth * 0.025 : 0;

  // Actions
  const handleLogPaidZakat = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      // Need an account to subtract from, usually the first one
      const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', user.id).limit(1);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No active account found to log the transaction.');
      }
      
      // Need 'Zakat Al-Mal' category
      const { data: category } = await supabase.from('categories')
        .select('id')
        .eq('name', 'Zakat Al-Mal')
        .limit(1)
        .single();
        
      if (!category) {
        throw new Error('Zakat Al-Mal category not found in the database. Please create it first.');
      }

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: accounts[0].id,
        category_id: category.id,
        amount: -Math.abs(zakatAmount),
        type: 'expense',
        description: 'Zakat al-Mal — Annual Zakat payment',
        date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      setToast({ message: "Zakat logged. May Allah accept it. 🤲", tone: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to log Zakat.", tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCalculation = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('zakat_calculations').insert({
        user_id: user.id,
        total_wealth: totalWealth,
        nisab_value: nisabValue,
        zakat_due: zakatAmount,
        hawl_confirmed: hawlPassed,
        calculation_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      setToast({ message: "Calculation saved successfully.", tone: 'success' });
    } catch (err: any) {
      // Fallback
      localStorage.setItem(`zakat_calc_${user.id}_${Date.now()}`, JSON.stringify({
        totalWealth, nisabValue, zakatAmount, hawlPassed, date: new Date()
      }));
      setToast({ message: "Saved locally. (Database insert failed)", tone: 'info' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen px-5 pb-32 pt-[var(--pt-safe)]">
        <div className="absolute inset-x-0 top-0 h-[22rem] rounded-b-[3.5rem] bg-gradient-to-br from-emerald-200/90 via-teal-200/80 to-sky-200/70 dark:from-emerald-400/20 dark:via-teal-500/15 dark:to-sky-400/10" />

        <div className="relative z-10 pt-2 mb-6">
          <h1 className="text-[2.75rem] font-black tracking-[-0.03em] text-slate-900 dark:text-white leading-tight">
            Zakat Calculator
          </h1>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400 font-arabic">
            حاسبة الزكاة
          </p>
        </div>

        <div className="relative space-y-5">
          {/* DISCLAIMER */}
          <Card className="border border-emerald-500/20 bg-emerald-50 p-4 dark:bg-emerald-500/10">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-[13px] font-bold text-emerald-800 dark:text-emerald-200 leading-relaxed">
                This calculator follows ZATCA (Zakat, Tax & Customs Authority) guidelines for individuals. Results are estimates — consult a scholar for your specific situation.
              </p>
            </div>
          </Card>

          {/* NISAB CHECK */}
          <Card className="border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76 shadow-sm">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Nisab Check</h2>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Nisab Threshold</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(nisabValue, 'AED')}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">Based on 595 grams of pure silver.</p>
              </div>
              <div className="border-t border-slate-100 pt-4 dark:border-white/5 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Silver Price / Gram (AED)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">AED</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={silverPricePerGram || ''}
                    onChange={(e) => setSilverPricePerGram(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-[1.25rem] border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 px-1 pt-1 font-medium leading-relaxed">
                  Silver Nisab is used for cash and salaries as it is the lower threshold and more inclusive standard.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 px-1 pt-2">
            <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Zakatable Assets</h2>
          </div>

          <div className="space-y-4">
            <AccordionSection title="Cash & Bank Savings" isOpen={openSection === 'cash'} onToggle={() => toggleSection('cash')}>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Balance (AED)</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={cashBalance || ''}
                    onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                    placeholder="0.00"
                  />
                </div>
                {cashBalance > 0 && <p className="text-[11px] font-bold text-emerald-500 px-1">Estimated from your BarakahFlow balance.</p>}
                <p className="text-[11px] font-medium text-slate-500 px-1">Include all savings accounts, cash at home, and digital wallets.</p>
              </div>
            </AccordionSection>

            <AccordionSection title="Gold" isOpen={openSection === 'gold'} onToggle={() => toggleSection('gold')}>
              <div className="space-y-4">
                <p className="text-[11px] font-medium text-slate-500 px-1">Only gold held for saving/investment. Gold worn daily for personal use is exempt per Islamic ruling.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight (g)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={goldWeight || ''}
                      onChange={(e) => setGoldWeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Karat</label>
                    <select
                      value={goldKarat}
                      onChange={(e) => setGoldKarat(parseInt(e.target.value))}
                      className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                    >
                      <option value="24">24k</option>
                      <option value="22">22k</option>
                      <option value="21">21k</option>
                      <option value="18">18k</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Price / Gram (AED)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={goldPricePerGram || ''}
                    onChange={(e) => setGoldPricePerGram(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                </div>
                {goldValue > 0 && (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <span className="text-xs font-bold text-slate-500">Zakatable Value: </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(goldValue, 'AED')}</span>
                  </div>
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Silver" isOpen={openSection === 'silver'} onToggle={() => toggleSection('silver')}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight (g)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={silverWeight || ''}
                    onChange={(e) => setSilverWeight(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  />
                </div>
                {silverAssetValue > 0 && (
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <span className="text-xs font-bold text-slate-500">Zakatable Value: </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(silverAssetValue, 'AED')}</span>
                  </div>
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Money Owed To You" isOpen={openSection === 'debts-owed'} onToggle={() => toggleSection('debts-owed')}>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (AED)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={moneyOwed || ''}
                  onChange={(e) => setMoneyOwed(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  placeholder="0.00"
                />
                <p className="text-[11px] font-medium text-slate-500 px-1">Only include debts you are confident will be paid back. Do not include doubtful debts.</p>
              </div>
            </AccordionSection>

            <AccordionSection title="Business / Trade Inventory" isOpen={openSection === 'business'} onToggle={() => toggleSection('business')}>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Market Value (AED)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={businessInventory || ''}
                  onChange={(e) => setBusinessInventory(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
                  placeholder="0.00"
                />
                <p className="text-[11px] font-medium text-slate-500 px-1">Include only goods you own for the purpose of selling for profit.</p>
              </div>
            </AccordionSection>
          </div>

          <div className="flex items-center gap-2 px-1 pt-3">
            <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Conditions & Deductions</h2>
          </div>

          <Card className="border border-white/70 bg-white/82 p-5 dark:border-white/10 dark:bg-slate-900/76">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">Include Salary Savings</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[200px]">Calculate Zakat on your total wealth including saved salary portions at once.</p>
              </div>
              <div
                role="switch"
                aria-checked={includeSalary}
                onClick={() => setIncludeSalary(!includeSalary)}
                className={`flex h-8 w-14 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
                  includeSalary ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    includeSalary ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <AnimatePresence>
              {includeSalary && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10"
                >
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Add your net saved salary to your Cash & Bank Savings figure above to easily calculate your Zakat altogether.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="border border-white/70 bg-white/82 p-5 dark:border-white/10 dark:bg-slate-900/76">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">Hawl Requirement</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Has this wealth been in your possession for at least 1 full lunar year (354 days)?</p>
              </div>
              <div
                role="switch"
                aria-checked={hawlPassed}
                onClick={() => setHawlPassed(!hawlPassed)}
                className={`flex h-8 w-14 cursor-pointer shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${
                  hawlPassed ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    hawlPassed ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <AnimatePresence>
              {!hawlPassed && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10"
                >
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Zakat is only due after one full lunar year (Hawl) has passed on wealth that meets Nisab. Your result is an estimate if your wealth is newer.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="border border-amber-500/20 bg-amber-50 p-4 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-[13px] font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
                Note: According to ZATCA guidelines, personal debts you owe do not reduce your Zakat. You pay 2.5% on your full zakatable wealth.
              </p>
            </div>
          </Card>

          {/* RESULTS CARD */}
          <div className="mt-8 rounded-[2.5rem] bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-2xl shadow-emerald-500/20">
            <div className="rounded-[2.5rem] bg-slate-900 p-6 px-7 text-white">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 text-center mb-6">Calculation Results</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-sm font-semibold text-slate-300">Total Zakatable Wealth</span>
                  <span className="text-xl font-black">{formatCurrency(totalWealth, 'AED')}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-sm font-semibold text-slate-300">Nisab Status</span>
                  {isNisabMet ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Zakat Due
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-400">
                      Not Yet Due
                    </span>
                  )}
                </div>
                
                <div className="pt-4">
                  <p className="text-sm font-semibold text-slate-300 mb-2">Total Zakat Due</p>
                  <p className="text-[2.75rem] font-black tracking-tighter text-white">
                    {formatCurrency(zakatAmount, 'AED')}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-400">Formula: {formatCurrency(totalWealth, 'AED')} ÷ 40 = {formatCurrency(totalWealth / 40, 'AED')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 pb-4">
            <Button
              size="lg"
              onClick={handleLogPaidZakat}
              disabled={zakatAmount <= 0}
              loading={saving}
              className={`w-full rounded-2xl py-4 flex items-center justify-center gap-2 ${zakatAmount <= 0 ? 'opacity-50' : 'shadow-xl shadow-emerald-500/20'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              Log as Paid Zakat
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSaveCalculation}
              loading={saving}
              className="w-full rounded-2xl py-4 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5 text-slate-400" />
              Save Calculation
            </Button>
          </div>
          
        </div>
        
        <Toast message={toast.message} tone={toast.tone} />
      </div>
    </PageTransition>
  );
}
