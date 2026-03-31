'use client';

import { useEffect, useState } from 'react';

interface BudgetRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  topLabel?: string;
  bottomLabel?: string;
}

export function getBudgetStatusColor(percentage: number) {
  if (percentage < 50) return '#10B981';
  if (percentage < 75) return '#F59E0B';
  if (percentage < 90) return '#F97316';
  return '#EF4444';
}

export default function BudgetRing({
  percentage,
  size = 160,
  strokeWidth = 10,
  topLabel = 'Used',
  bottomLabel,
}: BudgetRingProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const normalizedPercentage = Math.max(0, percentage);
  const progressPercentage = Math.min(normalizedPercentage, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringColor = getBudgetStatusColor(normalizedPercentage);
  const center = size / 2;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimatedPercentage(progressPercentage));
    return () => window.cancelAnimationFrame(frame);
  }, [progressPercentage]);

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-white/5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (animatedPercentage / 100) * circumference}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ 
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${ringColor}88)`
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {topLabel && (
          <span className={`${size < 100 ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-0.5`}>
            {topLabel}
          </span>
        )}
        <span className={`${size < 100 ? 'text-xl' : 'text-4xl'} font-extrabold tracking-tight text-slate-900 dark:text-white Montserrat leading-none`}>
          {Math.round(normalizedPercentage)}%
        </span>
        {bottomLabel && (
          <span className={`${size < 100 ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1`}>
            {bottomLabel}
          </span>
        )}
      </div>
    </div>
  );
}
