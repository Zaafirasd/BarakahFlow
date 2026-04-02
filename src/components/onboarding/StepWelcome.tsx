'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

interface StepWelcomeProps {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="text-center space-y-12 py-8 min-h-screen flex flex-col justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.5 }}
      >
        <Image
          src="/logo.png"
          alt="BarakahFlow"
          width={240}
          height={100}
          className="mx-auto drop-shadow-[0_20px_40px_rgba(16,185,129,0.15)]"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="space-y-6"
      >
        <div className="space-y-1">
          <h1 className="text-[3.2rem] font-black leading-tight tracking-tight text-slate-900 dark:text-white Montserrat">
            Barakah<span className="text-emerald-500">Flow</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] ml-1">
            Faith-Centric Finance
          </p>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-[280px] mx-auto leading-snug tracking-tight">
          Assalamu Alaikum. Let&apos;s personalize your experience.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="pt-10 w-full max-w-sm mx-auto"
      >
        <Button onClick={onNext} size="lg" fullWidth className="rounded-[2.2rem] py-6 text-xl font-black shadow-[0_20px_50px_rgba(16,185,129,0.25)] border-none">
          Get Started
        </Button>
      </motion.div>
    </div>
  );
}
