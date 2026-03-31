'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  colorMode?: 'dynamic' | 'emerald';
}

export default function ProgressBar({
  value,
  className = '',
  showLabel = false,
  size = 'md',
  colorMode = 'dynamic',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const getColor = () => {
    if (colorMode === 'emerald') return 'bg-emerald-500';
    if (clampedValue < 60) return 'bg-emerald-500';
    if (clampedValue < 85) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          className={`${heights[size]} rounded-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-400 mt-1 text-right">{Math.round(clampedValue)}%</p>
      )}
    </div>
  );
}
