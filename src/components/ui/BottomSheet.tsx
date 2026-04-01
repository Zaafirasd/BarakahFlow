'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children, title, footer }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('bottom-sheet-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('bottom-sheet-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('bottom-sheet-open');
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-[2px] z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[110] flex max-h-[92vh] flex-col overflow-hidden rounded-t-[2.5rem] border border-slate-200/70 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex shrink-0 justify-center pb-2 pt-3">
              <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 pb-4 pt-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white Montserrat">
                    {title}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Scrolling Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
                {children}
              </div>

              {/* Pinned Footer — in normal flow so scroll can never push it off screen */}
              {footer && (
                <div
                  className="shrink-0 border-t border-slate-100 bg-white px-6 pt-4 dark:border-white/5 dark:bg-slate-900"
                  style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
                >
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
