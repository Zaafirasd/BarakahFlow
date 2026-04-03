'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface GoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrams: number;
  onUpdate: (newGrams: number) => void;
  userId: string;
}

export default function GoldModal({ isOpen, onClose, currentGrams, onUpdate, userId }: GoldModalProps) {
  const [grams, setGrams] = useState(currentGrams.toString());
  const [saving, setSaving] = useState(false);

  // Sync state when currentGrams changes (e.g. when modal opens)
  useEffect(() => {
    setGrams(currentGrams.toString());
  }, [currentGrams, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const numGrams = parseFloat(grams) || 0;
    
    // 1. Always save to localStorage first for immediate persistence
    if (typeof window !== 'undefined' && userId) {
      localStorage.setItem(`barakahflow_gold_${userId}`, numGrams.toString());
    }

    try {
      const supabase = createClient();
      await supabase
        .from('users')
        .update({ gold_grams: numGrams })
        .eq('id', userId);

      onUpdate(numGrams);
      onClose();
    } catch {
      // Still update UI since we have localStorage backup
      onUpdate(numGrams);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-[2rem] bg-white p-7 shadow-2xl pointer-events-auto dark:bg-slate-900 border border-slate-200 dark:border-white/10 overflow-hidden h-fit"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                  <Coins className="h-6 w-6" />
                </div>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white Montserrat">
                    Gold Holdings
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Enter the total weight of your 24K gold assets in grams.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-2xl font-black text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-amber-500/30"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 dark:text-slate-600">
                    grams
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  loading={saving}
                  fullWidth
                  className="rounded-[1.8rem] py-5 text-lg font-black shadow-xl shadow-amber-500/25 !bg-amber-500 hover:!bg-amber-600 focus:ring-amber-500/20"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </Button>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
