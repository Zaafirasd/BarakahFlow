'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Zap, Wifi, Home, Shield, Heart, Info } from 'lucide-react';
import { GLOBAL_BILL_TEMPLATES } from '@/lib/constants/bill-templates';
import { formatBillFrequency, formatDayLabel } from '@/lib/utils/getFinancialMonth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DayPickerGrid from '@/components/ui/DayPickerGrid';
import BottomSheet from '@/components/ui/BottomSheet';
import type { BillFrequency, OnboardingData, OnboardingBill } from '@/types';

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
      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white appearance-none"
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Partial<OnboardingBill> | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  const handleOpenSheet = (template?: (typeof GLOBAL_BILL_TEMPLATES)[0]) => {
    if (template) {
      setEditingBill({
        name: template.name,
        frequency: template.frequency,
        amount: undefined,
        dueDay: undefined,
      });
      setShowCustom(false);
    } else {
      setEditingBill({
        name: '',
        frequency: 'monthly',
        amount: undefined,
        dueDay: undefined,
      });
      setShowCustom(true);
    }
    setIsSheetOpen(true);
  };

  const addBill = (name: string, amount: number, dueDay: number, frequency: BillFrequency) => {
    updateData({
      bills: [...data.bills, { name, amount, dueDay, frequency }],
    });
    setIsSheetOpen(false);
    setEditingBill(null);
  };

  const removeBill = (index: number) => {
    const newBills = [...data.bills];
    newBills.splice(index, 1);
    updateData({ bills: newBills });
  };

  const isAdded = (name: string) => data.bills.some((bill) => bill.name === name);

  return (
    <div className="space-y-6 max-w-full pb-32">
      <div className="text-center">
        <h2 className="text-[2.2rem] font-extrabold tracking-tight text-slate-900 dark:text-white Montserrat leading-tight">Fixed bills</h2>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Regular expenses we should track</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-0.5">
        {GLOBAL_BILL_TEMPLATES.map((template) => (
          <button
            key={template.name}
            type="button"
            onClick={() => !isAdded(template.name) && handleOpenSheet(template)}
            disabled={isAdded(template.name)}
            className={`flex w-full items-center gap-3 rounded-[1.3rem] p-3 text-left transition-all ${
              isAdded(template.name)
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-inner'
                : 'border border-slate-200 bg-white hover:border-emerald-500/30 hover:bg-slate-50/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isAdded(template.name) ? 'bg-emerald-500/10' : 'bg-slate-50 dark:bg-white/5'}`}>
              {ICON_MAP[template.icon]}
            </div>
            <div className="min-w-0 pr-1">
              <span className="block truncate text-xs font-black text-slate-900 dark:text-white leading-tight">{template.name}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{template.frequency}</span>
            </div>
          </button>
        ))}
      </div>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={showCustom ? "Add Custom Bill" : `Add ${editingBill?.name}`}
        footer={
          <Button
            fullWidth
            disabled={!editingBill?.amount || editingBill?.dueDay === undefined}
            onClick={() => {
              if (!editingBill?.name || !editingBill?.amount || editingBill.dueDay === undefined) return;
              addBill(editingBill.name, editingBill.amount, editingBill.dueDay, editingBill.frequency || 'monthly');
            }}
            className="rounded-[1.5rem] py-4.5 font-black text-lg shadow-xl shadow-emerald-500/20"
          >
            Add Bill
          </Button>
        }
      >
        <div className="space-y-6 pt-2 pb-8">
          {showCustom && (
            <Input
              label="Bill name"
              placeholder="E.g. Netflix"
              value={editingBill?.name || ''}
              onChange={(e) => setEditingBill(prev => ({ ...prev, name: e.target.value }))}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-4">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={editingBill?.amount || ''}
                  onChange={(e) => setEditingBill(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-lg font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-widest">{data.currency}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 ml-4">Frequency</label>
              <FrequencySelect
                value={editingBill?.frequency || 'monthly'}
                onChange={(f) => setEditingBill(prev => ({ ...prev, frequency: f }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-4">
              <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Monthly Due Day</label>
              {editingBill?.dueDay !== undefined && (
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Day {editingBill.dueDay === 0 ? 'Last' : editingBill.dueDay}</span>
              )}
            </div>
            <DayPickerGrid
              selectedDay={editingBill?.dueDay ?? null}
              onSelect={(d) => setEditingBill(prev => ({ ...prev, dueDay: d }))}
            />
          </div>
        </div>
      </BottomSheet>

      {data.bills.length > 0 && (
        <div className="space-y-4 px-1">
          <div className="flex items-center justify-between px-2">
             <h3 className="onboarding-label Montserrat !ml-0">Added Bills</h3>
             <span className="text-[10px] font-black text-emerald-500 Montserrat uppercase tracking-widest">{data.bills.length} Tracking</span>
          </div>
          <div className="space-y-3 max-h-[160px] overflow-y-auto no-scrollbar pr-1 pb-4">
            {data.bills.map((bill, index) => (
              <motion.div
                key={`${bill.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-[1.6rem] border border-white/70 bg-white/50 px-5 py-4 dark:border-white/5 dark:bg-white/5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-slate-900 dark:text-white leading-tight Montserrat">{bill.name}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 Montserrat uppercase tracking-tight">
                    {bill.amount} {data.currency} • Due Day {bill.dueDay}
                  </p>
                </div>
                <button type="button" onClick={() => removeBill(index)} className="ml-3 rounded-full bg-slate-500/10 p-2.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500 active:scale-90">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 px-1">
        <button
          type="button"
          onClick={() => handleOpenSheet()}
          className="flex w-full items-center justify-center gap-3 rounded-[1.6rem] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:text-white"
        >
          <Plus className="h-4 w-4" /> Add custom bill
        </button>
      </div>
    </div>
  );
}
