'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-slate-700 shadow-sm backdrop-blur-xl transition active:scale-95 dark:border-white/10 dark:bg-slate-900/76 dark:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}
