export default function AddTransactionLoading() {
  return (
    <div className="p-5 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-11 w-11 rounded-2xl bg-slate-200 dark:bg-white/5" />
        <div className="h-6 w-40 rounded-lg bg-slate-200 dark:bg-white/5" />
        <div className="w-11" />
      </div>
      <div className="flex justify-center">
        <div className="h-16 w-48 rounded-2xl bg-slate-200 dark:bg-white/5" />
      </div>
      <div className="h-12 rounded-3xl bg-slate-200 dark:bg-white/5" />
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-slate-200 dark:bg-white/5" />
        ))}
      </div>
    </div>
  );
}
