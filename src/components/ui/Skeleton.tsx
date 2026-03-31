'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-white/5 rounded-xl ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-5 pt-4">
      <Skeleton className="h-44 w-full rounded-[2.5rem]" />
      <div className="flex gap-4">
        <Skeleton className="h-32 flex-1 rounded-[2.5rem]" />
        <Skeleton className="h-32 flex-1 rounded-[2.5rem]" />
      </div>
      <Skeleton className="h-28 w-full rounded-[2.5rem]" />
      <Skeleton className="h-28 w-full rounded-[2.5rem]" />
    </div>
  );
}
