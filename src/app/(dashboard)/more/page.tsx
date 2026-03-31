'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, MoonStar, ReceiptText, Shield, UserRound } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageTransition from '@/components/ui/PageTransition';
import { createClient } from '@/lib/supabase/client';

const menuItems = [
  { label: 'Bills', href: '/bills', icon: ReceiptText },
  { label: 'Zakat', href: '/zakat', icon: MoonStar },
  { label: 'Profile', href: '/profile', icon: UserRound },
  { label: 'Privacy Policy', href: '/privacy-policy', icon: Shield },
];

export default function MorePage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.replace('/signin');
  };

  return (
    <PageTransition>
      <div className="min-h-screen px-5 pb-32 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">More</h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">More pages, settings, and account actions.</p>

        <Card className="mt-7 border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center justify-between rounded-[1.4rem] px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="mt-5 border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76">
          {!confirming ? (
            <Button variant="danger" fullWidth onClick={() => setConfirming(true)} className="rounded-3xl py-4 text-base font-bold">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Sign out of BarakaFlow on this device?</p>
              <div className="flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button variant="danger" fullWidth onClick={handleSignOut} loading={signingOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
