'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100/70 via-sky-100/60 to-violet-100/60 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/70 bg-white/88 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="BarakaFlow" width={200} height={80} className="mx-auto mb-3" priority />
            <p className="text-sm text-slate-500 dark:text-slate-400">Reset your password</p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-500/10">
                <Mail className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Check your inbox</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We sent a password reset link to <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span>.
                Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/signin"
                className="mt-4 block text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Back to Sign In
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Enter the email address linked to your account and we&apos;ll send you a reset link.
              </p>

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                error={error}
                icon={<Mail className="w-4 h-4" />}
                id="forgot-email"
              />

              <Button type="submit" fullWidth loading={loading} size="lg">
                Send Reset Link
              </Button>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                <Link href="/signin" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Back to Sign In
                </Link>
              </p>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
