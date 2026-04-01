'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function EmailVerifiedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-100/70 via-sky-100/60 to-violet-100/60 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/40 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Email Verified!
        </h1>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          Your email has been successfully confirmed. You&apos;re all set to get started.
        </p>

        {/* CTA */}
        <Link
          href="/onboarding"
          className="block w-full rounded-2xl bg-slate-900 py-3.5 text-center text-sm font-semibold text-white transition-all active:scale-95 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
