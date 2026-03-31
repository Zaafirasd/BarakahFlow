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
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2 rounded-[2.2rem] bg-slate-100/40 p-3 dark:bg-white/5">
        {DAY_OPTIONS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-bold transition-all active:scale-90 ${
              selectedDay === day
                ? 'bg-emerald-500 text-white shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)]'
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
            className={`col-span-7 mt-2 flex flex-col items-center justify-center rounded-2xl py-4 transition-all active:scale-[0.97] ${
              selectedDay === 0
                ? 'bg-emerald-500 text-white shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)]'
                : 'border border-transparent bg-white text-slate-600 hover:border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/10 dark:hover:text-white'
            }`}
          >
            <span className="text-sm font-black tracking-tight">{formatDayLabel(0)}</span>
            <span className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-60 ${selectedDay === 0 ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              Flexible end of month
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
