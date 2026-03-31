'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Plus, PieChart, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

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

  return (
    <div className={`min-h-screen ${isAddTransaction ? '' : 'pb-24'}`}>
      {/* Page Content */}
      {children}

      {/* Bottom Tab Bar */}
      {!isAddTransaction && (
        <nav className="fixed bottom-4 left-0 right-0 z-50 px-4">
          <div className="mx-auto grid max-w-sm grid-cols-5 items-center rounded-full border border-slate-200/80 bg-white/88 px-2 py-2 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
            {tabs.map(tab => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              if (tab.isCenter) {
                return (
                  <div key={tab.name} className="flex justify-center">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => router.push(tab.href)}
                      className="flex h-14 w-14 -mt-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:shadow-black/30 dark:hover:bg-slate-100"
                      aria-label="Add transaction"
                    >
                      <Icon className="w-7 h-7" />
                    </motion.button>
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
