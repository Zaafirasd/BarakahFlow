'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Zap, Wifi, Home, Shield, Heart, Info } from 'lucide-react';
import { UAE_BILL_TEMPLATES } from '@/lib/constants/bill-templates';
import { formatBillFrequency, formatDayLabel } from '@/lib/utils/getFinancialMonth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DayPickerGrid from '@/components/ui/DayPickerGrid';
import type { BillFrequency, OnboardingData } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-5 w-5" />,
  Wifi: <Wifi className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
};

const FREQUENCY_OPTIONS: BillFrequency[] = ['monthly', 'quarterly', 'annual'];

function FrequencySelect({
  value,
  onChange,
}: {
  value: BillFrequency;
  onChange: (value: BillFrequency) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as BillFrequency)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
    >
      {FREQUENCY_OPTIONS.map((option) => (
        <option key={option} value={option} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
          {formatBillFrequency(option)}
        </option>
      ))}
    </select>
  );
}

export default function StepBills({ data, updateData, onNext }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void; onNext: () => void }) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState('');
  const [tempDueDay, setTempDueDay] = useState<number | null>(null);
  const [tempFrequency, setTempFrequency] = useState<BillFrequency>('monthly');
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customDueDay, setCustomDueDay] = useState<number | null>(null);
  const [customFrequency, setCustomFrequency] = useState<BillFrequency>('monthly');

  const addBill = (name: string, amount: number, dueDay: number, frequency: BillFrequency) => {
    updateData({
      bills: [...data.bills, { name, amount, dueDay, frequency }],
    });
    setExpandedTemplate(null);
    setTempAmount('');
    setTempDueDay(null);
    setTempFrequency('monthly');
  };

  const removeBill = (index: number) => {
    const newBills = [...data.bills];
    newBills.splice(index, 1);
    updateData({ bills: newBills });
  };

  const addCustomBill = () => {
    if (customName && customAmount && customDueDay !== null) {
      addBill(customName, parseFloat(customAmount), customDueDay, customFrequency);
      setCustomName('');
      setCustomAmount('');
      setCustomDueDay(null);
      setCustomFrequency('monthly');
      setShowCustom(false);
    }
  };

  const isAdded = (name: string) => data.bills.some((bill) => bill.name === name);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[2.2rem] font-extrabold tracking-tight text-slate-900 dark:text-white">Regular bills</h2>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Add bills so we can track your remaining cash</p>
      </div>

      <div className="rounded-[1.8rem] bg-indigo-500/5 p-4 border border-indigo-500/10">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed">
            Don&apos;t worry if you miss any—you can add, edit, or remove bills anytime from your Dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {UAE_BILL_TEMPLATES.map((template) => (
          <div key={template.name} className="relative">
            <button
              type="button"
              onClick={() => {
                if (!isAdded(template.name)) {
                  if (expandedTemplate !== template.name) {
                    setTempAmount('');
                    setTempDueDay(null);
                    setTempFrequency(template.frequency);
                  }
                  setExpandedTemplate(expandedTemplate === template.name ? null : template.name);
                }
              }}
              disabled={isAdded(template.name)}
              className={`flex w-full items-center gap-3 rounded-[1.3rem] p-4 text-left transition-all ${
                isAdded(template.name)
                  ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-inner'
                  : expandedTemplate === template.name
                    ? 'ring-2 ring-emerald-500 border-transparent bg-white shadow-xl dark:bg-slate-800'
                    : 'border border-slate-200 bg-white hover:border-emerald-500/30 hover:bg-slate-50/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isAdded(template.name) ? 'bg-emerald-500/10' : 'bg-slate-50 dark:bg-white/5'}`}>
                {ICON_MAP[template.icon]}
              </div>
              <div className="min-w-0 pr-1">
                <span className="block truncate text-sm font-black text-slate-900 dark:text-white leading-tight">{template.name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{formatBillFrequency(template.frequency)}</span>
              </div>
            </button>

            <AnimatePresence>
              {expandedTemplate === template.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="z-10 col-span-2 mt-2"
                >
                  <div className="space-y-4 rounded-[1.8rem] border border-emerald-500/30 bg-emerald-500/5 p-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Amount</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="450"
                        value={tempAmount}
                        onChange={(e) => setTempAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Frequency</label>
                      <FrequencySelect value={tempFrequency} onChange={setTempFrequency} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Monthly Due Day</label>
                      <DayPickerGrid selectedDay={tempDueDay} onSelect={setTempDueDay} />
                    </div>

                    <Button
                      fullWidth
                      disabled={!tempAmount || tempDueDay === null}
                      onClick={() => {
                        if (tempDueDay === null) return;
                        addBill(template.name, parseFloat(tempAmount), tempDueDay, tempFrequency);
                      }}
                      className="rounded-2xl py-4 font-black"
                    >
                      Add Bill
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {data.bills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Added Bills</h3>
             <span className="text-[10px] font-black text-emerald-500">{data.bills.length} Tracking</span>
          </div>
          <div className="space-y-2">
            {data.bills.map((bill, index) => (
              <motion.div
                key={`${bill.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-[1.4rem] border border-white/70 bg-white/50 px-5 py-4 dark:border-white/5 dark:bg-white/5"
              >
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{bill.name}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {bill.amount} {data.currency} • {formatDayLabel(bill.dueDay)}
                  </p>
                </div>
                <button type="button" onClick={() => removeBill(index)} className="rounded-full bg-rose-500/10 p-2 text-rose-500 transition-colors hover:bg-rose-500/20">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        {showCustom ? (
          <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <Input label="Bill name" placeholder="E.g. Netflix" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Frequency</label>
                <FrequencySelect value={customFrequency} onChange={setCustomFrequency} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Due Day</label>
              <DayPickerGrid selectedDay={customDueDay} onSelect={setCustomDueDay} />
            </div>

            <Button fullWidth onClick={addCustomBill} disabled={!customName || !customAmount || customDueDay === null} className="rounded-2xl py-4 font-black">
              Add Custom Bill
            </Button>
            <button onClick={() => setShowCustom(false)} className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest">Cancel</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="flex items-center gap-2 rounded-2xl border border-transparent bg-slate-100 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-white"
          >
            <Plus className="h-4 w-4" /> Add custom bill
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 pt-4">
        <Button onClick={onNext} fullWidth size="lg" className="rounded-[1.8rem] py-5 text-lg font-black shadow-2xl shadow-emerald-500/25">
          Continue
        </Button>
        <button type="button" onClick={onNext} className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
          I'll Add Them Later
        </button>
      </div>
    </div>
  );
}
