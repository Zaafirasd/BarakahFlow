'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { OnboardingData } from '@/types';

interface StepCompleteProps {
  data: OnboardingData;
}

export default function StepComplete({ data }: StepCompleteProps) {
  const symbol = formatCurrency(0, data.currency).replace(/[0.,\s]/g, '');

  return (
    <div className="space-y-10 pt-10 flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative flex items-center justify-center p-8 overflow-visible"
      >
         {/* Premium Radial Glow (GPU Accelerated) */}
         <div 
           className="absolute h-64 w-64 pointer-events-none opacity-50"
           style={{
             background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
             transform: 'translate3d(0,0,0)',
             backfaceVisibility: 'hidden'
           }}
         />
         
         {/* Icon Container */}
         <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#f8fafc] dark:bg-[#020617] border-[4px] border-emerald-500 shadow-xl shadow-emerald-500/20">
           <Sparkles className="h-12 w-12 text-emerald-500" strokeWidth={2.5} />
         </div>
      </motion.div>

      <div className="text-center">
        <h2 className="text-[2.6rem] font-black tracking-tight text-slate-900 dark:text-white Montserrat leading-tight">You&apos;re all set!</h2>
        <p className="mt-2 text-base font-medium text-slate-500 dark:text-slate-400 tracking-tight">BarakahFlow is ready for your journey.</p>
      </div>

      <div className="w-full space-y-3 pb-8">
        {/* User Info Row */}
        <div className="flex items-center justify-between rounded-[2rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-5 px-7 shadow-sm">
           <span className="onboarding-label Montserrat !ml-0 uppercase tracking-widest text-[9px]">Account</span>
           <span className="text-base font-black text-slate-900 dark:text-white Montserrat">{data.name} ({data.currency})</span>
        </div>

        {/* Financial Summary card */}
        <div className="rounded-[2.2rem] bg-emerald-500/5 border border-emerald-500/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <span className="onboarding-label Montserrat !ml-0 !text-emerald-600/70 uppercase tracking-widest text-[9px]">Calculated Balance</span>
             <span className="text-lg font-black text-emerald-600 Montserrat">{symbol} {data.initialBalance.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
             <span className="onboarding-label Montserrat !ml-0 !text-slate-400 uppercase tracking-widest text-[9px]">Monthly Income</span>
             <span className="text-sm font-black text-slate-900 dark:text-white Montserrat">{symbol} {data.income.toLocaleString()}</span>
          </div>
        </div>

        {/* Bills Info */}
        <div className="flex items-center justify-between rounded-[2.2rem] bg-indigo-500/5 border border-indigo-500/10 p-5 px-7 shadow-sm">
           <div className="flex flex-col">
             <span className="onboarding-label Montserrat !ml-0 !text-indigo-500/70 uppercase tracking-widest text-[9px]">Tracking Items</span>
             <span className="text-sm font-black text-indigo-600 dark:text-white Montserrat">{data.bills.length} Active Bills</span>
           </div>
           <div className="flex -space-x-2">
             {data.bills.slice(0, 3).map((_, i) => (
               <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-[#020617] bg-indigo-500 flex items-center justify-center shadow-lg">
                 <span className="text-[8px] text-white font-black Montserrat">B</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
