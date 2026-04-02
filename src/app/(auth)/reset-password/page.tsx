'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(Boolean(code));
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!code) {
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      setExchanging(false);
      if (error) {
        setErrors({ general: 'This reset link has expired or already been used. Please request a new one.' });
      } else {
        setSessionReady(true);
      }
    });
  }, [code]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirm = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErrors({ general: error.message });
      return;
    }

    await supabase.auth.signOut();
    router.replace('/signin?reset=success');
  };

  if (exchanging) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Verifying reset link...</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Invalid or expired reset link. Please request a new one.
        </div>
        <Link href="/forgot-password" className="block text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
          Request a new link
        </Link>
      </div>
    );
  }

  if (errors.general && !sessionReady) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {errors.general}
        </div>
        <Link href="/forgot-password" className="block text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
        Choose a strong new password for your account.
      </p>

      <Input
        label="New Password"
        type="password"
        placeholder="Min 8 characters"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
        error={errors.password}
        icon={<Lock className="w-4 h-4" />}
        id="reset-password"
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your new password"
        value={confirmPassword}
        onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirm: undefined })); }}
        error={errors.confirm}
        icon={<Lock className="w-4 h-4" />}
        id="reset-confirm-password"
      />

      {errors.general && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {errors.general}
        </div>
      )}

      <Button type="submit" fullWidth loading={loading} size="lg">
        Set New Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100/70 via-sky-100/60 to-violet-100/60 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 pt-[var(--pt-safe)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/70 bg-white/88 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="BarakahFlow" width={200} height={80} className="mx-auto mb-3" priority />
            <p className="text-sm text-slate-500 dark:text-slate-400">Set a new password</p>
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </motion.div>
    </div>
  );
}
