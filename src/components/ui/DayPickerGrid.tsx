'use client';

import { formatDayLabel } from '@/lib/utils/getFinancialMonth';

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

interface DayPickerGridProps {
  selectedDay: number | null;
  onSelect: (day: number) => void;
  allowLastDay?: boolean;
}

export default function DayPickerGrid({ selectedDay, onSelect, allowLastDay = true }: DayPickerGridProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 rounded-[1.8rem] bg-slate-100/60 p-2 dark:bg-white/5">
        {DAY_OPTIONS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 ${
              selectedDay === day
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'border border-transparent bg-white text-slate-600 hover:border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-white'
            }`}
          >
            {day}
          </button>
        ))}

        {allowLastDay ? (
          <button
            type="button"
            onClick={() => onSelect(0)}
            className={`col-span-7 mt-1 flex flex-col items-center justify-center rounded-xl py-3 transition-all active:scale-[0.98] ${
              selectedDay === 0
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'border border-transparent bg-white text-slate-600 hover:border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-white'
            }`}
          >
            <span className="text-sm font-bold">{formatDayLabel(0)}</span>
            <span className={`text-[10px] font-medium opacity-70 ${selectedDay === 0 ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              Automatically adjusts to 28, 30, or 31
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
