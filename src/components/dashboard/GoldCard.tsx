'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Plus, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface GoldCardProps {
  grams: number;
  currency: string;
  pricePerGram: number | null;
  isCachedPrice?: boolean;
  onManage: () => void;
}

export default function GoldCard({ grams, currency, pricePerGram, isCachedPrice, onManage }: GoldCardProps) {
  const totalValue = pricePerGram ? grams * pricePerGram : 0;
  const loading = pricePerGram === null;

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-amber-600/[0.08] p-6 shadow-sm transition-all hover:bg-amber-500/[0.05] dark:border-amber-500/10 dark:from-amber-400/5 dark:to-amber-500/10 dark:shadow-none">
      {/* Background Subtle Glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20" />
      
      <div className="relative flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white Montserrat">Gold Assets</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600/80 dark:text-amber-400/80">
                24K Investment Grade
              </p>
            </div>
          </div>
          
          <button
            onClick={onManage}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-slate-600 shadow-sm transition-all hover:bg-white hover:text-amber-600 active:scale-95 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-amber-400"
          >
            {grams > 0 ? <Edit2 className="h-4 w-4" /> : <Plus className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-[-0.03em] text-slate-900 dark:text-white">
              {grams}g
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              Valuation:
            </span>
            <span className="text-[15px] font-black text-amber-600 dark:text-amber-400">
              {loading ? '...' : formatCurrency(totalValue, currency)}
            </span>
            {!loading && pricePerGram && (
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isCachedPrice
                  ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {isCachedPrice ? 'Cached' : 'Live'}
              </div>
            )}
          </div>
        </div>

        {grams === 0 && (
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            No gold holdings tracked yet.
          </p>
        )}
      </div>
    </div>
  );
}
