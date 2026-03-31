'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

interface StepWelcomeProps {
  onNext: () => void;
}

export default function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <Image
          src="/logo.png"
          alt="BarakaFlow"
          width={240}
          height={96}
          className="mx-auto"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white Montserrat">
          Bismillah.
        </p>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          Let&apos;s set up your finances.
        </p>
        <p className="text-slate-500 text-sm">
          A quick setup to personalize your experience
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button onClick={onNext} size="lg" fullWidth>
          Get Started
        </Button>
      </motion.div>
    </div>
  );
}
