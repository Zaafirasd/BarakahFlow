'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[App Error]', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-500/10">
          <AlertTriangle className="h-10 w-10 text-rose-500" />
        </div>

        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          An unexpected error occurred. Your data is safe - try refreshing.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[10px] text-slate-400 dark:text-slate-600">
            ref: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-slate-900 px-6 py-4 text-sm font-black text-white transition active:scale-95 dark:bg-white dark:text-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
