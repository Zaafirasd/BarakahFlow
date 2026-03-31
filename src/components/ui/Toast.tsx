'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  tone?: ToastTone;
}

const toneConfig: Record<ToastTone, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'bg-emerald-500 text-white shadow-emerald-500/25',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-rose-500 text-white shadow-rose-500/25',
  },
  info: {
    icon: Info,
    className: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
  },
};

export default function Toast({ message, tone = 'success' }: ToastProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className={`fixed bottom-28 left-5 right-5 z-[120] rounded-[1.4rem] px-5 py-4 shadow-2xl ${config.className}`}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" />
            <p className="text-sm font-bold">{message}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
