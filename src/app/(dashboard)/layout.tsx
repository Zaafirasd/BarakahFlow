'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Plus, PieChart, Menu } from 'lucide-react';
import OfflineBanner from '@/components/ui/OfflineBanner';

const tabs = [
  { name: 'Home', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Transactions', icon: ArrowLeftRight, href: '/transactions' },
  { name: 'Add', icon: Plus, href: '/add-transaction', isCenter: true },
  { name: 'Budget', icon: PieChart, href: '/budget' },
  { name: 'More', icon: Menu, href: '/more' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isAddTransaction = pathname === '/add-transaction';

  useEffect(() => {
    // Re-sync onboarding cookie for existing users to ensure snappy navigation
    if (typeof document !== 'undefined' && !document.cookie.includes('bf_onboarding_done')) {
      document.cookie = "bf_onboarding_done=true; path=/; max-age=31536000; SameSite=Lax";
    }
  }, []);

  return (
    <div className={`min-h-screen ${isAddTransaction ? '' : 'pb-32'}`} style={isAddTransaction ? undefined : { paddingBottom: 'max(8rem, calc(6rem + env(safe-area-inset-bottom)))' }}>
      <OfflineBanner />
      {/* Page Content */}
      {children}

      {/* Bottom Tab Bar */}
      {!isAddTransaction && (
        <nav className="bottom-nav fixed left-0 right-0 z-50 px-4" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="mx-auto grid max-w-sm grid-cols-5 items-center rounded-full border border-slate-200/80 bg-white/88 px-2 py-2 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
            {tabs.map(tab => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              if (tab.isCenter) {
                return (
                  <div key={tab.name} className="flex justify-center">
                    <button
                      onClick={() => router.push(tab.href)}
                      className="flex h-14 w-14 -mt-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-transform duration-200 hover:bg-slate-800 active:scale-90 dark:bg-white dark:text-slate-950 dark:shadow-black/30 dark:hover:bg-slate-100"
                      aria-label="Add transaction"
                    >
                      <Icon className="w-7 h-7" />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={tab.name}
                  onClick={() => router.push(tab.href)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1 transition-colors ${
                    isActive ? 'text-sky-500 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium text-center">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
