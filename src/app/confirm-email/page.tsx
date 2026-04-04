'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Image from 'next/image';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleAccept = async () => {
    if (!code) {
      router.push('/signin?error=invalid-code');
      return;
    }
    
    setIsConfirming(true);
    // Introduce a slight delay for "premium feel" transition
    setTimeout(() => {
      router.push(`/auth/callback?code=${code}&next=/onboarding`);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-slate-50 to-emerald-100/40 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 pt-[var(--pt-safe)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative"
      >
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <Card className="glass-card overflow-hidden border-white/40 dark:border-white/5">
          <div className="p-8 pb-10 text-center relative z-10">
            {/* App Logo */}
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-10"
            >
              <Image
                src="/logo.png"
                alt="BarakahFlow"
                width={160}
                height={64}
                className="mx-auto drop-shadow-sm"
                priority
              />
            </motion.div>

            {/* Verification State Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"
                />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-emerald-500/10 dark:border-white/5">
                   {isConfirming ? (
                     <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
                   ) : (
                     <Mail className="h-12 w-12 text-emerald-500" />
                   )}
                </div>
                
                {!isConfirming && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
                    className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-slate-900"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Messaging */}
            <AnimatePresence mode="wait">
              {isConfirming ? (
                <motion.div
                  key="confirming"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="min-h-[120px]"
                >
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
                    Securing your account...
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                    We're finalizing your verification. You'll be redirected in a moment.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="min-h-[120px]"
                >
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
                    Accept Invitation?
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[300px] mx-auto">
                    You're one step away from joining BarakahFlow. Click below to confirm your email and start your journey.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-10 space-y-3">
              <Button
                onClick={handleAccept}
                disabled={isConfirming}
                fullWidth
                size="lg"
                className="rounded-2xl py-6 font-black tracking-wide shadow-emerald-500/20 shadow-lg group"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>ACCEPT & CONTINUE</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </Button>
              
              <button 
                onClick={() => router.push('/signin')}
                disabled={isConfirming}
                className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2"
              >
                Not you? Return to Sign In
              </button>
            </div>
          </div>
        </Card>

        {/* Aesthetic Footer */}
        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
          Powered by BarakahFlow Security
        </p>
      </motion.div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
