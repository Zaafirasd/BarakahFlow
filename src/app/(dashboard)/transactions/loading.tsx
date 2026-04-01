export default function TransactionsLoading() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-slate-200 rounded-xl dark:bg-white/5" />
      <div className="h-4 w-28 bg-slate-200 rounded-lg dark:bg-white/5" />
      <div className="mt-4 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-white/5" />
        ))}
      </div>
    </div>
  );
}
