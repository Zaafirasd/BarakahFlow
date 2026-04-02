'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

interface StepWelcomeProps {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="text-center space-y-12 py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
      >
        <Image
          src="/logo-onboarding.png"
          alt="BarakahFlow"
          width={280}
          height={120}
          className="mx-auto drop-shadow-2xl"
          priority
          onError={(e) => {
            // Fallback if the logo doesn't exist yet
            e.currentTarget.src = '/logo.png';
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <h1 className="text-[2.6rem] font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white Montserrat">
            Barakah<span className="text-emerald-500">Flow</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[11px] ml-1">
            Faith-Centric Finance
          </p>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-base font-medium max-w-[280px] mx-auto leading-relaxed">
          Welcome. Let&apos;s personalize your experience in exactly 2 minutes.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="pt-4"
      >
        <Button onClick={onNext} size="lg" fullWidth className="rounded-[2.2rem] py-6 text-xl font-black shadow-2xl shadow-emerald-500/25">
          Get Started
        </Button>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400/60 transition-opacity hover:opacity-100">
          Streamlined • International • Private
        </p>
      </motion.div>
    </div>
  );
}
