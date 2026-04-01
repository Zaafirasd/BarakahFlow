export default function MoreLoading() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-10 w-32 rounded-2xl bg-slate-200 dark:bg-white/5" />
      <div className="h-4 w-64 rounded-lg bg-slate-200 dark:bg-white/5" />
      <div className="mt-4 h-56 rounded-[2rem] bg-slate-200 dark:bg-white/5" />
      <div className="h-16 rounded-[2rem] bg-slate-200 dark:bg-white/5" />
    </div>
  );
}
