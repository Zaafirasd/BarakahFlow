'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, ShieldAlert } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DayPickerGrid from '@/components/ui/DayPickerGrid';
import PageHeader from '@/components/ui/PageHeader';
import PageTransition from '@/components/ui/PageTransition';
import Toast from '@/components/ui/Toast';
import { CURRENCIES } from '@/lib/constants/categories';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDateLabel, formatDayLabel } from '@/lib/utils/getFinancialMonth';
import { sanitizeText, validateAmount, validateEmail } from '@/lib/utils/validation';
import { getZakatStorageKey } from '@/lib/utils/zakat';
import type { Category, User } from '@/types';
import { invalidateDashboardCache } from '@/lib/utils/dashboardCache';

type BudgetWithCategory = { amount: number; category?: Pick<Category, 'name'> | Pick<Category, 'name'>[] | null };
type ActiveSheet =
  | 'name'
  | 'email'
  | 'currency'
  | 'payday'
  | 'income'
  | 'zakatEnable'
  | 'zakatDisable'
  | 'zakatDate'
  | 'password'
  | 'signout'
  | 'delete'
  | null;

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

interface SettingsRowProps {
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}

interface FormErrors {
  name?: string;
  email?: string;
  income?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function SettingsSection({ title, children }: SectionProps) {
  return (
    <Card className="border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{title}</p>
      <div className="divide-y divide-slate-100 dark:divide-white/5">{children}</div>
    </Card>
  );
}

function SettingsRow({ label, value, onClick, danger = false, trailing }: SettingsRowProps) {
  const content = (
    <>
      <div>
        <p className={`text-sm font-bold ${danger ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{label}</p>
        {value ? <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{value}</p> : null}
      </div>
      {trailing || (
        <ChevronRight className={`h-4 w-4 shrink-0 ${danger ? 'text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} />
      )}
    </>
  );

  if (!onClick) {
    return <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-4 py-4 text-left first:pt-0 last:pb-0">
      {content}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' }>({
    message: '',
    tone: 'success',
  });
  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [incomeDraft, setIncomeDraft] = useState('');
  const [zakatDateDraft, setZakatDateDraft] = useState(new Date().toISOString().split('T')[0]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (toast.message) {
        setToast((current) => ({ ...current, message: '' }));
      }
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [toast.message]);

  const loadProfile = async () => {
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return;
    }

    const [profileResult, budgetsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('budgets').select('amount, category:categories(name)').eq('user_id', authUser.id).eq('is_active', true),
    ]);

    if (profileResult.data) {
      const profile = profileResult.data as User;
      setUser(profile);
      setNameDraft(profile.name || '');
      setEmailDraft(profile.email || '');
      setIncomeDraft(profile.monthly_income ? String(profile.monthly_income) : '');
      setZakatDateDraft(profile.zakat_anniversary_date || new Date().toISOString().split('T')[0]);
    }

    setBudgets((budgetsResult.data || []) as unknown as BudgetWithCategory[]);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const avatarLetter = (user?.name || user?.email || 'B').charAt(0).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const updateProfile = async (updates: Record<string, unknown>, successMessage: string) => {
    if (!user) return false;

    setSaving(true);
    const supabase = createClient();
    const result = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setSaving(false);

    if (result.error) {
      setToast({ message: result.error.message, tone: 'error' });
      return false;
    }

    setUser((current) => (current ? ({ ...current, ...updates } as User) : current));
    setToast({ message: successMessage, tone: 'success' });
    
    // Invalidate dashboard cache for this user
    invalidateDashboardCache(user.id);
    
    return true;
  };

  const handleSaveName = async () => {
    if (!nameDraft.trim()) {
      setFormErrors({ name: 'Name is required' });
      return;
    }
    const sanitizedName = sanitizeText(nameDraft, 50);
    const success = await updateProfile({ name: sanitizedName || null }, 'Name updated');
    if (success) {
      setFormErrors({});
      setActiveSheet(null);
    }
  };

  const handleSaveEmail = async () => {
    if (!user) return;
    const normalizedEmail = emailDraft.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setFormErrors({ email: 'Enter a valid email address' });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const authResult = await supabase.auth.updateUser({ email: normalizedEmail });

    if (authResult.error) {
      setSaving(false);
      setFormErrors({ email: authResult.error.message });
      return;
    }

    setSaving(false);

    // If confirmation is required, the 'new_email' property will exist but 'email' remains same.
    // We only update our local DB if the auth record already matches.
    if (authResult.data.user?.email?.toLowerCase() === normalizedEmail) {
      const profileResult = await supabase
        .from('users')
        .update({ email: normalizedEmail, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileResult.error) {
        setFormErrors({ email: profileResult.error.message });
        return;
      }

      setUser((current) => (current ? { ...current, email: normalizedEmail } : current));
      setToast({ message: 'Email updated successfully', tone: 'success' });
    } else {
      setToast({ message: 'Check your new email for a verification link', tone: 'info' });
    }

    setFormErrors({});
    setActiveSheet(null);
  };

  const handleSaveIncome = async () => {
    const validatedIncome = validateAmount(incomeDraft);
    if (validatedIncome === null || validatedIncome <= 0) {
      setFormErrors({ income: 'Enter a valid monthly income > 0' });
      return;
    }

    const success = await updateProfile({ monthly_income: validatedIncome }, 'Income updated');
    if (success) {
      setFormErrors({});
      setActiveSheet(null);
    }
  };

  const handleSelectCurrency = async (currencyCode: string) => {
    const success = await updateProfile({ primary_currency: currencyCode }, 'Currency updated');
    if (success) {
      setActiveSheet(null);
    }
  };

  const handleSelectPayDay = async (day: number) => {
    const success = await updateProfile({ financial_month_start_day: day }, 'Pay day updated');
    if (success) {
      setActiveSheet(null);
    }
  };

  const handleEnableZakat = async () => {
    const success = await updateProfile(
      {
        zakat_enabled: true,
        zakat_anniversary_date: zakatDateDraft,
      },
      'Zakat tracking updated'
    );

    if (success) {
      setActiveSheet(null);
    }
  };

  const handleDisableZakat = async () => {
    const success = await updateProfile(
      {
        zakat_enabled: false,
        zakat_anniversary_date: null,
      },
      'Zakat tracking disabled'
    );

    if (success) {
      setActiveSheet(null);
    }
  };

  const handleSaveZakatDate = async () => {
    const success = await updateProfile({ zakat_anniversary_date: zakatDateDraft }, 'Zakat anniversary updated');
    if (success) {
      setActiveSheet(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    const errors: FormErrors = {};

    if (!passwordForm.currentPassword) errors.currentPassword = 'Required';
    if (!passwordForm.newPassword) errors.newPassword = 'Required';
    
    if (passwordForm.newPassword && passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Min 8 characters';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const verifyResult = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.currentPassword,
    });

    if (verifyResult.error) {
      setSaving(false);
      setFormErrors({ currentPassword: 'Incorrect password' });
      return;
    }

    const updateResult = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setSaving(false);

    if (updateResult.error) {
      setFormErrors({ newPassword: updateResult.error.message });
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setFormErrors({});
    setActiveSheet(null);
    setToast({ message: 'Password updated', tone: 'success' });
  };

  const handleSignOut = async () => {
    // Invalidate ALL dashboard caches on sign out for safety
    invalidateDashboardCache();
    
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'bf_onboarding_done=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/signin');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmation !== 'DELETE') {
      setToast({ message: 'Type DELETE to continue', tone: 'error' });
      return;
    }

    setSaving(true);
    
    try {
      // Direct call to a secure server-side route that uses service_role
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(getZakatStorageKey(user.id));
      }

      // Force signout client-side and redirect
      const supabase = createClient();
      
      // Invalidate dashboard cache
      invalidateDashboardCache(user.id);
      
      await supabase.auth.signOut();
      document.cookie = 'bf_onboarding_done=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.replace('/signin');
      
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete account', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
        <div className="h-36 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
        <div className="h-40 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="relative min-h-screen px-5 pb-32 pt-[var(--pt-safe)]">
        <div className="top-glow" />
        <PageHeader title="Profile" subtitle="Account settings, financial preferences, and Islamic finance options." />

        <Card className="border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-2xl font-extrabold text-white">
              {avatarLetter}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{user?.name || 'BarakahFlow member'}</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{user?.email}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Member since {memberSince}</p>
            </div>
          </div>
        </Card>

        <div className="mt-7 space-y-5">
          <SettingsSection title="Personal Information">
            <SettingsRow label="Name" value={user?.name || 'Not set'} onClick={() => setActiveSheet('name')} />
            <SettingsRow label="Email" value={user?.email || 'Not set'} onClick={() => setActiveSheet('email')} />
            <SettingsRow label="Currency" value={user?.primary_currency || 'AED'} onClick={() => setActiveSheet('currency')} />
            <SettingsRow
              label="Pay Day"
              value={formatDayLabel(user?.financial_month_start_day ?? 1)}
              onClick={() => setActiveSheet('payday')}
            />
          </SettingsSection>

          <SettingsSection title="Financial">
            <SettingsRow
              label="Monthly Income"
              value={user?.monthly_income ? formatCurrency(user.monthly_income, user.primary_currency) : 'Not set'}
              onClick={() => setActiveSheet('income')}
            />
          </SettingsSection>

          <SettingsSection title="Islamic Finance">
            <SettingsRow
              label="Zakat Tracking"
              value={user?.zakat_enabled ? 'Enabled' : 'Disabled'}
              onClick={() => setActiveSheet(user?.zakat_enabled ? 'zakatDisable' : 'zakatEnable')}
              trailing={
                <div className={`flex h-7 w-12 items-center rounded-full px-1 transition ${user?.zakat_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'}`}>
                  <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${user?.zakat_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              }
            />
            <SettingsRow
              label="Zakat Anniversary"
              value={user?.zakat_anniversary_date ? formatDateLabel(user.zakat_anniversary_date) : 'Not set'}
              onClick={() => setActiveSheet('zakatDate')}
            />
          </SettingsSection>

          <SettingsSection title="Account">
            <SettingsRow label="Change Password" onClick={() => setActiveSheet('password')} />
            <SettingsRow
              label="Sign Out"
              onClick={() => setActiveSheet('signout')}
              trailing={<LogOut className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
            />
            <SettingsRow label="Delete Account" onClick={() => setActiveSheet('delete')} danger />
          </SettingsSection>
        </div>

        <BottomSheet
          isOpen={activeSheet === 'name'}
          onClose={() => { setActiveSheet(null); setFormErrors({}); }}
          title="Update Name"
          footer={
            <Button fullWidth onClick={handleSaveName} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              Save
            </Button>
          }
        >
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Name</label>
            <input
              id="profile-name"
              type="text"
              value={nameDraft}
              onChange={(event) => { setNameDraft(event.target.value); setFormErrors({}); }}
              className={`w-full rounded-[1.5rem] border ${formErrors.name ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
            />
            {formErrors.name && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{formErrors.name}</p>}
          </div>
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'email'}
          onClose={() => { setActiveSheet(null); setFormErrors({}); }}
          title="Update Email"
          footer={
            <Button fullWidth onClick={handleSaveEmail} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              Save
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="rounded-[1.6rem] bg-slate-50 p-4 dark:bg-white/5">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Supabase may ask you to confirm the new email address before the change is fully applied.</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={emailDraft}
                onChange={(event) => { setEmailDraft(event.target.value); setFormErrors({}); }}
                className={`w-full rounded-[1.5rem] border ${formErrors.email ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
              />
              {formErrors.email && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{formErrors.email}</p>}
            </div>
          </div>
        </BottomSheet>

        <BottomSheet isOpen={activeSheet === 'currency'} onClose={() => setActiveSheet(null)} title="Choose Currency">
          <div className="grid grid-cols-2 gap-3">
            {CURRENCIES.map((currencyOption) => (
              <button
                key={currencyOption.code}
                type="button"
                onClick={() => handleSelectCurrency(currencyOption.code)}
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  user?.primary_currency === currencyOption.code
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                }`}
              >
                <p className="text-sm font-extrabold">{currencyOption.code}</p>
                <p className="mt-1 text-xs font-medium opacity-70">{currencyOption.name}</p>
              </button>
            ))}
          </div>
        </BottomSheet>

        <BottomSheet isOpen={activeSheet === 'payday'} onClose={() => setActiveSheet(null)} title="Choose Pay Day">
          <DayPickerGrid selectedDay={user?.financial_month_start_day ?? 1} onSelect={handleSelectPayDay} />
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'income'}
          onClose={() => { setActiveSheet(null); setFormErrors({}); }}
          title="Monthly Income"
          footer={
            <Button fullWidth onClick={handleSaveIncome} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              Save
            </Button>
          }
        >
          <div className="space-y-1.5">
            <label htmlFor="profile-income" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Income</label>
            <input
              id="profile-income"
              type="number"
              inputMode="decimal"
              value={incomeDraft}
              onChange={(event) => { setIncomeDraft(event.target.value); setFormErrors({}); }}
              className={`w-full rounded-[1.5rem] border ${formErrors.income ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
            />
            {formErrors.income && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{formErrors.income}</p>}
          </div>
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'zakatEnable'}
          onClose={() => setActiveSheet(null)}
          title="Enable Zakat Tracking"
          footer={
            <Button fullWidth onClick={handleEnableZakat} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              Save
            </Button>
          }
        >
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Choose the date BarakahFlow should use for your annual Zakat reminder.</p>
            <input
              type="date"
              value={zakatDateDraft}
              onChange={(event) => setZakatDateDraft(event.target.value)}
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 [color-scheme:light] dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark] transition-all"
            />
          </div>
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'zakatDisable'}
          onClose={() => setActiveSheet(null)}
          title="Disable Zakat Tracking?"
          footer={
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setActiveSheet(null)}>
                Cancel
              </Button>
              <Button fullWidth onClick={handleDisableZakat} loading={saving}>
                Disable
              </Button>
            </div>
          }
        >
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Your Zakat page will hide until you turn tracking back on.</p>
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'zakatDate'}
          onClose={() => setActiveSheet(null)}
          title="Zakat Anniversary"
          footer={
            <Button fullWidth onClick={handleSaveZakatDate} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              Save
            </Button>
          }
        >
          <input
            type="date"
            value={zakatDateDraft}
            onChange={(event) => setZakatDateDraft(event.target.value)}
            className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 [color-scheme:light] dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark] transition-all"
          />
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'password'}
          onClose={() => { setActiveSheet(null); setFormErrors({}); }}
          title="Change Password"
          footer={
            <Button fullWidth onClick={handleUpdatePassword} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              Update Password
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => { setPasswordForm((current) => ({ ...current, currentPassword: event.target.value })); setFormErrors({}); }}
                placeholder="Current password"
                className={`w-full rounded-[1.5rem] border ${formErrors.currentPassword ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
              />
              {formErrors.currentPassword && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{formErrors.currentPassword}</p>}
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => { setPasswordForm((current) => ({ ...current, newPassword: event.target.value })); setFormErrors({}); }}
                placeholder="New password"
                className={`w-full rounded-[1.5rem] border ${formErrors.newPassword ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
              />
              {formErrors.newPassword && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{formErrors.newPassword}</p>}
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => { setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value })); setFormErrors({}); }}
                placeholder="Confirm new password"
                className={`w-full rounded-[1.5rem] border ${formErrors.confirmPassword ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
              />
              {formErrors.confirmPassword && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{formErrors.confirmPassword}</p>}
            </div>
          </div>
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'signout'}
          onClose={() => setActiveSheet(null)}
          title="Sign Out?"
          footer={
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setActiveSheet(null)}>
                Cancel
              </Button>
              <Button fullWidth onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          }
        >
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">You&apos;ll be returned to the sign-in screen.</p>
        </BottomSheet>

        <BottomSheet
          isOpen={activeSheet === 'delete'}
          onClose={() => setActiveSheet(null)}
          title="Delete Account"
          footer={
            <Button variant="danger" fullWidth onClick={handleDeleteAccount} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              Clear My Data
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  This will permanently delete your account and all associated financial data. This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Type <span className="font-extrabold text-slate-900 dark:text-white">DELETE</span> to continue.</p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder="DELETE"
              className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white transition-all"
            />
          </div>
        </BottomSheet>

        <Toast message={toast.message} tone={toast.tone} />
      </div>
    </PageTransition>
  );
}
