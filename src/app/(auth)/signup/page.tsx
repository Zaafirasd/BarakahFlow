'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent, METRICS } from '@/lib/utils/analytics';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirm = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
        },
      });

      if (error) {
        setErrors({ general: error.message });
        return;
      }

      if (data.user) {
        trackEvent(METRICS.SIGNUP);
        
        // If session exists, they are auto-confirmed (or email confirmation is off)
        if (data.session) {
          document.cookie = 'bf_onboarding_done=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          router.push('/onboarding');
        } else {
          // Email confirmation is required
          setSignedUp(true);
        }
      }
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100/70 via-sky-100/60 to-violet-100/60 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 pt-[var(--pt-safe)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/70 bg-white/88 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900/76 dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {signedUp ? (
            <div className="text-center py-4">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                  <Mail className="w-10 h-10" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Check your email</h2>
               <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                  We've sent a confirmation link to <span className="text-slate-900 dark:text-white font-bold">{email}</span>. Please click the link to activate your account.
               </p>
               <Button onClick={() => router.push('/signin')} fullWidth variant="secondary">
                  Return to Sign In
               </Button>
            </div>
          ) : (
            <>
              {/* Logo */}
              <div className="text-center mb-8">
                <Image
                  src="/logo.png"
                  alt="BarakahFlow"
                  width={200}
                  height={80}
                  className="mx-auto mb-3"
                  priority
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">Halal personal finance tracker</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  icon={<Mail className="w-4 h-4" />}
                  id="signup-email"
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  icon={<Lock className="w-4 h-4" />}
                  id="signup-password"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirm}
                  icon={<Lock className="w-4 h-4" />}
                  id="signup-confirm-password"
                />

                {errors.general && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                    {errors.general}
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Create Account
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link href="/signin" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
