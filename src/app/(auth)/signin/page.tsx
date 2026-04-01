'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent, METRICS } from '@/lib/utils/analytics';
import { validateEmail } from '@/lib/utils/validation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordReset = searchParams.get('reset') === 'success';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('confirm') || authError.status === 400) {
          setError('Email not confirmed. Please check your inbox for the activation link.');
        } else {
          setError(authError.message);
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Signed in, but we could not confirm your session. Please try again.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        setError('Signed in, but we could not load your profile. Please try again.');
        return;
      }

      trackEvent(METRICS.SIGNIN);
      router.push(profile?.onboarding_completed ? '/dashboard' : '/onboarding');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <Image
              src="/logo.png"
              alt="BarakahFlow"
              width={200}
              height={80}
              className="mx-auto mb-3"
              priority
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back</p>
          </div>

          {passwordReset && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Password updated - please sign in with your new password.
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              id="signin-email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              id="signin-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs font-medium text-slate-400 hover:text-emerald-500 transition-colors dark:text-slate-500">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
