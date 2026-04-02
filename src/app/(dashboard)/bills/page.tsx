'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Check, CircleAlert, Plus, Trash2 } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DayPickerGrid from '@/components/ui/DayPickerGrid';
import LucideIcon from '@/components/ui/LucideIcon';
import PageHeader from '@/components/ui/PageHeader';
import PageTransition from '@/components/ui/PageTransition';
import Toast from '@/components/ui/Toast';
import { GLOBAL_BILL_TEMPLATES } from '@/lib/constants/bill-templates';
import { createClient } from '@/lib/supabase/client';
import {
  advanceBillNextDueDate,
  buildBillPaymentDescription,
  getBillFrequencyLabel,
  getBillIconName,
  getMonthKey,
  getPreviousBillDueDate,
  isDateInMonth,
  parseBillPaymentDescription,
  resolveBillCategoryName,
} from '@/lib/utils/bills';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { sanitizeText, validateAmount } from '@/lib/utils/validation';
import { trackEvent, METRICS } from '@/lib/utils/analytics';
import { calculateNextDueDate, daysUntil, formatDateLabel, formatDayLabel } from '@/lib/utils/getFinancialMonth';
import type { Bill, BillFrequency, Category, Transaction, User } from '@/types';

type ExpenseCategory = Pick<Category, 'id' | 'name'>;

interface BillFormState {
  name: string;
  amount: string;
  dueDay: number;
  frequency: BillFrequency;
}

interface PaymentFormState {
  amount: string;
  date: string;
}

interface FormErrors {
  name?: string;
  amount?: string;
  date?: string;
}

const DEFAULT_BILL_FORM: BillFormState = {
  name: '',
  amount: '',
  dueDay: 1,
  frequency: 'monthly',
};

const FREQUENCY_OPTIONS: BillFrequency[] = ['monthly', 'quarterly', 'annual'];

function getMonthBounds(referenceDate: Date) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function getBillDueCopy(bill: Bill) {
  const diff = daysUntil(bill.next_due_date);

  if (diff < 0) {
    return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`;
  }

  if (diff === 0) {
    return 'Due today';
  }

  return `Due in ${diff} day${diff === 1 ? '' : 's'}`;
}

function getAccentClasses(section: 'overdue' | 'dueSoon' | 'upcoming' | 'paid') {
  if (section === 'overdue') {
    return 'border-l-4 border-rose-500';
  }

  if (section === 'dueSoon') {
    return 'border-l-4 border-amber-400';
  }

  if (section === 'paid') {
    return 'border-l-4 border-emerald-500';
  }

  return 'border-l-4 border-transparent';
}

export default function BillsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [paySheetOpen, setPaySheetOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [billForm, setBillForm] = useState<BillFormState>(DEFAULT_BILL_FORM);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [billErrors, setBillErrors] = useState<FormErrors>({});
  const [paymentErrors, setPaymentErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' }>({
    message: '',
    tone: 'success',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [today] = useState(() => new Date());
  const currentMonthKey = getMonthKey(today);
  const currency = user?.primary_currency || 'AED';

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (toast.message) {
        setToast((current) => ({ ...current, message: '' }));
      }
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast.message]);

  const loadBills = async () => {
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return;
    }

    const monthBounds = getMonthBounds(new Date());

    const [profileResult, billsResult, categoriesResult, accountsResult, transactionsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('bills').select('*').eq('user_id', authUser.id).eq('is_active', true).order('next_due_date', { ascending: true }),
      supabase
        .from('categories')
        .select('id, name')
        .or(`user_id.eq.${authUser.id},user_id.is.null`)
        .eq('type', 'expense')
        .order('sort_order', { ascending: true }),
      supabase.from('accounts').select('id').eq('user_id', authUser.id).eq('is_active', true).limit(1),
      supabase
        .from('transactions')
        .select('id, amount, date, description, merchant_name, category_id, account_id, type, user_id')
        .eq('user_id', authUser.id)
        .eq('type', 'expense')
        .gte('date', monthBounds.start)
        .lte('date', monthBounds.end)
        .order('date', { ascending: false }),
    ]);

    if (profileResult.data) {
      setUser(profileResult.data as User);
    }

    setBills((billsResult.data || []) as Bill[]);
    setCategories((categoriesResult.data || []) as ExpenseCategory[]);
    setAccountId(accountsResult.data?.[0]?.id || null);
    setTransactions((transactionsResult.data || []) as Transaction[]);
    setLoading(false);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadBills();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const billPaymentMap = useMemo(() => {
    const map = new Map<string, Transaction>();

    transactions.forEach((transaction) => {
      const paymentMeta = parseBillPaymentDescription(transaction.description);
      if (!paymentMeta || paymentMeta.monthKey !== currentMonthKey) {
        return;
      }

      const existing = map.get(paymentMeta.billId);
      if (!existing || new Date(transaction.date).getTime() > new Date(existing.date).getTime()) {
        map.set(paymentMeta.billId, transaction);
      }
    });

    return map;
  }, [currentMonthKey, transactions]);

  const countedThisMonthBillIds = useMemo(() => {
    return new Set(
      bills
        .filter((bill) => {
          const paidRecord = billPaymentMap.get(bill.id);
          if (isDateInMonth(bill.next_due_date, today)) {
            return true;
          }

          if (!paidRecord) {
            return false;
          }

          return isDateInMonth(getPreviousBillDueDate(bill), today);
        })
        .map((bill) => bill.id)
    );
  }, [billPaymentMap, bills, today]);

  const totalDue = useMemo(
    () =>
      bills.reduce((sum, bill) => {
        return countedThisMonthBillIds.has(bill.id) ? sum + Number(bill.amount) : sum;
      }, 0),
    [bills, countedThisMonthBillIds]
  );

  const totalPaid = useMemo(
    () =>
      bills.reduce((sum, bill) => {
        if (!countedThisMonthBillIds.has(bill.id)) {
          return sum;
        }

        const payment = billPaymentMap.get(bill.id);
        return payment ? sum + Math.abs(Number(payment.amount)) : sum;
      }, 0),
    [billPaymentMap, bills, countedThisMonthBillIds]
  );

  const remaining = Math.max(totalDue - totalPaid, 0);
  const progress = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0;

  const paidBills = bills.filter((bill) => billPaymentMap.has(bill.id));
  const overdueBills = bills.filter((bill) => !billPaymentMap.has(bill.id) && daysUntil(bill.next_due_date) < 0);
  const dueSoonBills = bills.filter((bill) => {
    if (billPaymentMap.has(bill.id)) {
      return false;
    }

    const diff = daysUntil(bill.next_due_date);
    return diff >= 0 && diff <= 7;
  });
  const upcomingBills = bills.filter((bill) => {
    if (billPaymentMap.has(bill.id)) {
      return false;
    }

    return daysUntil(bill.next_due_date) > 7;
  });

  const openAddSheet = (templateName?: string, templateFrequency?: BillFrequency) => {
    setEditingBill(null);
    setConfirmDelete(false);
    setBillForm({
      name: templateName || '',
      amount: '',
      dueDay: 1,
      frequency: templateFrequency || 'monthly',
    });
    setBillErrors({});
    setEditorOpen(true);
  };

  const openEditSheet = (bill: Bill) => {
    setEditingBill(bill);
    setConfirmDelete(false);
    setBillForm({
      name: bill.name,
      amount: String(bill.amount),
      dueDay: bill.due_day,
      frequency: bill.frequency,
    });
    setBillErrors({});
    setEditorOpen(true);
  };

  const openPaySheet = (bill: Bill) => {
    setPayingBill(bill);
    setPaymentForm({
      amount: String(bill.amount),
      date: new Date().toISOString().split('T')[0],
    });
    setPaymentErrors({});
    setPaySheetOpen(true);
  };

  const validateBillForm = (): boolean => {
    const errors: FormErrors = {};
    const parsedAmount = Number(billForm.amount);
    
    if (!billForm.name.trim()) {
      errors.name = 'Bill name is required';
    }
    
    if (!billForm.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Enter a valid amount > 0';
    }

    setBillErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBill = async () => {
    if (!user) return;
    if (!validateBillForm()) return;

    setSaving(true);
    const sanitizedName = sanitizeText(billForm.name, 50);
    const validatedAmount = validateAmount(billForm.amount) || 0;
    const supabase = createClient();

    const payload = {
      name: sanitizedName,
      amount: validatedAmount,
      due_day: billForm.dueDay,
      frequency: billForm.frequency,
      next_due_date: calculateNextDueDate(billForm.dueDay, billForm.frequency).toISOString().split('T')[0],
    };

    const result = editingBill
      ? await supabase.from('bills').update(payload).eq('id', editingBill.id)
      : await supabase.from('bills').insert({ ...payload, user_id: user.id, is_active: true });

    setSaving(false);

    if (result.error) {
      setBillErrors({ name: result.error.message });
      return;
    }

    if (!editingBill) {
      trackEvent(METRICS.BILL_ADDED);
    }

    setEditorOpen(false);
    setBillForm(DEFAULT_BILL_FORM);
    setEditingBill(null);
    setToast({ message: editingBill ? 'Bill updated' : 'Bill added', tone: 'success' });
    await loadBills();
  };

  const handleDeleteBill = async () => {
    if (!editingBill) return;

    setSaving(true);
    const supabase = createClient();
    const result = await supabase.from('bills').delete().eq('id', editingBill.id);
    setSaving(false);

    if (result.error) {
      setToast({ message: result.error.message, tone: 'error' });
      return;
    }

    trackEvent(METRICS.BILL_DELETED);
    setEditorOpen(false);
    setEditingBill(null);
    setConfirmDelete(false);
    setToast({ message: 'Bill deleted', tone: 'success' });
    await loadBills();
  };

  const validatePaymentForm = (): boolean => {
    const errors: FormErrors = {};
    const parsedAmount = Number(paymentForm.amount);
    
    if (!paymentForm.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = 'Enter a valid amount > 0';
    }
    
    if (!paymentForm.date) {
      errors.date = 'Date is required';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmPayment = async () => {
    if (!user || !payingBill || !accountId) {
      setToast({ message: 'Add an account before marking bills as paid', tone: 'error' });
      return;
    }

    if (!validatePaymentForm()) return;

    const parsedAmount = Number(paymentForm.amount);
    const categoryName = resolveBillCategoryName(payingBill.name);
    const category = categories.find((entry) => entry.name === categoryName) || categories.find((entry) => entry.name === 'Miscellaneous');

    if (!category) {
      setToast({ message: 'No matching expense category found', tone: 'error' });
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: rpcError } = await supabase.rpc('pay_bill', {
      p_bill_id: payingBill.id,
      p_account_id: accountId,
      p_amount: parsedAmount,
      p_payment_date: paymentForm.date,
      p_category_id: category.id,
      p_description: buildBillPaymentDescription(payingBill.id, paymentForm.date),
    });

    setSaving(false);

    if (rpcError) {
      setToast({ message: rpcError.message, tone: 'error' });
      return;
    }

    setPaySheetOpen(false);
    setPayingBill(null);
    setToast({ message: `${payingBill.name} marked as paid`, tone: 'success' });
    await loadBills();
  };

  const renderBillCard = (bill: Bill, section: 'overdue' | 'dueSoon' | 'upcoming' | 'paid') => {
    const paymentRecord = billPaymentMap.get(bill.id);
    const iconName = getBillIconName(bill.name);

    return (
      <motion.div
        key={bill.id}
        whileTap={{ scale: 0.99 }}
        className={`w-full rounded-[2rem] border border-white/70 bg-white/82 p-5 text-left shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/76 ${getAccentClasses(section)}`}
      >
        <button type="button" onClick={() => openEditSheet(bill)} className="w-full text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-200">
                <LucideIcon name={iconName} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{bill.name}</p>
                  {paymentRecord ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                      className="rounded-full bg-emerald-500/10 p-1 text-emerald-500"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.div>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {getBillFrequencyLabel(bill.frequency)} | Due on {formatDayLabel(bill.due_day)}
                </p>
                <p className={`mt-2 text-sm font-bold ${paymentRecord ? 'text-emerald-500' : section === 'overdue' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {paymentRecord ? `Paid on ${formatDateLabel(paymentRecord.date)}` : getBillDueCopy(bill)}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(bill.amount, currency)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{new Date(bill.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>

            {paymentRecord ? (
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">Logged</span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Tap to edit</span>
            )}
          </div>
        </button>

        {paymentRecord ? null : (
          <div className="mt-4 border-t border-slate-100/70 pt-4 dark:border-white/5">
            <button
              type="button"
              onClick={() => openPaySheet(bill)}
              className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-500 transition hover:bg-emerald-500/10"
            >
              Mark Paid
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
        <div className="h-44 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
        <div className="h-32 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
        <div className="h-32 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-5 pb-32 pt-4">
        <PageHeader title="Bills" subtitle="Keep every recurring payment visible, editable, and on time." />

        <Card className="border border-white/70 bg-white/82 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/76">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">This Month&apos;s Bills</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: 'Total Due', value: totalDue },
              { label: 'Paid', value: totalPaid },
              { label: 'Remaining', value: remaining },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.4rem] bg-slate-50/90 px-2 py-3 text-center dark:bg-white/5">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 leading-tight">{item.label}</p>
                <p className="mt-1.5 text-sm font-extrabold leading-tight text-slate-900 dark:text-white tabular-nums">{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{currency}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
          </div>
        </Card>

        {bills.length === 0 ? (
          <div className="mt-8">
            <Card className="border border-dashed border-slate-300/70 bg-white/76 py-12 text-center dark:border-white/10 dark:bg-slate-900/76">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.8rem] bg-emerald-500/10 text-emerald-500">
                <CircleAlert className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">No bills tracked yet</h2>
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Add your bills so you never miss a payment.</p>
              <div className="mt-8">
                <Button onClick={() => openAddSheet()} className="rounded-3xl px-6 py-4 text-base font-bold">
                  <Plus className="h-4 w-4" />
                  Add Bill
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="mt-8 space-y-7">
            {[
              { title: 'Overdue', items: overdueBills, section: 'overdue' as const },
              { title: 'Due Soon', items: dueSoonBills, section: 'dueSoon' as const },
              { title: 'Upcoming', items: upcomingBills, section: 'upcoming' as const },
              { title: 'Paid', items: paidBills, section: 'paid' as const },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <section key={group.title}>
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{group.title}</h2>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{group.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((bill) => renderBillCard(bill, group.section))}
                  </div>
                </section>
              ))}
          </div>
        )}

        <div className="mt-8">
          <Card className="border border-white/70 bg-white/82 dark:border-white/10 dark:bg-slate-900/76">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Quick Add</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {GLOBAL_BILL_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => openAddSheet(template.name, template.frequency)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-500/30 hover:text-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  {template.name}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <Button fullWidth onClick={() => openAddSheet()} className="rounded-3xl py-4 text-base font-bold">
                <Plus className="h-4 w-4" />
                Add Bill
              </Button>
            </div>
          </Card>
        </div>

        <BottomSheet
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setConfirmDelete(false);
            setEditingBill(null);
            setBillErrors({});
          }}
          title={editingBill ? 'Edit Bill' : 'Add Bill'}
          footer={
            <Button fullWidth onClick={handleSaveBill} loading={saving} className="rounded-3xl py-5 text-base font-bold">
              {editingBill ? 'Save Changes' : 'Add Bill'}
            </Button>
          }
        >
          <div className="space-y-5">
            {!editingBill ? (
              <div className="flex flex-wrap gap-2">
                {GLOBAL_BILL_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => { setBillForm((current) => ({ ...current, name: template.name, frequency: template.frequency })); setBillErrors(prev => ({ ...prev, name: undefined })); }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor="bill-name" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Bill name</label>
              <input
                id="bill-name"
                type="text"
                value={billForm.name}
                onChange={(event) => { setBillForm((current) => ({ ...current, name: event.target.value })); setBillErrors(prev => ({ ...prev, name: undefined })); }}
                placeholder="DEWA"
                className={`w-full rounded-[1.5rem] border ${billErrors.name ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
              />
              {billErrors.name && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{billErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bill-amount" className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Amount</label>
              <input
                id="bill-amount"
                type="number"
                inputMode="decimal"
                value={billForm.amount}
                onChange={(event) => { setBillForm((current) => ({ ...current, amount: event.target.value })); setBillErrors(prev => ({ ...prev, amount: undefined })); }}
                placeholder="450"
                className={`w-full rounded-[1.5rem] border ${billErrors.amount ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
              />
              {billErrors.amount && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{billErrors.amount}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setBillForm((current) => ({ ...current, frequency: option }))}
                    className={`rounded-[1.4rem] px-3 py-3.5 text-xs font-black transition-all ${
                      billForm.frequency === option
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                    }`}
                  >
                    {getBillFrequencyLabel(option)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-4">Due day</label>
              <DayPickerGrid selectedDay={billForm.dueDay} onSelect={(day) => setBillForm((current) => ({ ...current, dueDay: day }))} />
            </div>

            {editingBill ? (
              confirmDelete ? (
                <div className="rounded-[1.8rem] border border-rose-500/20 bg-rose-500/10 p-5">
                  <p className="text-sm font-black text-rose-500 text-center">Delete this bill permanently?</p>
                  <div className="mt-4 flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)} className="py-3 rounded-2xl text-xs font-bold">
                      Keep Bill
                    </Button>
                    <Button variant="danger" fullWidth onClick={handleDeleteBill} loading={saving} className="py-3 rounded-2xl text-xs font-bold bg-rose-500 text-white border-transparent">
                      Delete Bill
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                   <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-500 ml-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Bill
                  </button>
                </div>
              )
            ) : null}
          </div>
        </BottomSheet>

        <BottomSheet
          isOpen={paySheetOpen}
          onClose={() => {
            setPaySheetOpen(false);
            setPayingBill(null);
            setPaymentErrors({});
          }}
          title={payingBill ? `Log Payment: ${payingBill.name}` : 'Mark Bill Paid'}
          footer={
            <Button fullWidth onClick={handleConfirmPayment} loading={saving} className="rounded-3xl py-5 text-base font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-none shadow-2xl">
              Log & Advance Cycle
            </Button>
          }
        >
          <div className="space-y-6 pb-8">
            <div className="rounded-[1.5rem] bg-amber-500/5 p-4 border border-amber-500/10">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Advances the bill to {payingBill ? advanceBillNextDueDate(payingBill) : 'next cycle'} and logs an expense transaction.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="payment-amount" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Amount paid</label>
              <div className="relative">
                <input
                  id="payment-amount"
                  type="number"
                  inputMode="decimal"
                  value={paymentForm.amount}
                  onChange={(event) => { setPaymentForm((current) => ({ ...current, amount: event.target.value })); setPaymentErrors(prev => ({ ...prev, amount: undefined })); }}
                  className={`w-full rounded-[1.5rem] border ${paymentErrors.amount ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-base font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:bg-white/5 dark:text-white transition-all`}
                />
                {paymentErrors.amount && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{paymentErrors.amount}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="payment-date" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Date paid</label>
              <div className="relative">
                <input
                  id="payment-date"
                  type="date"
                  value={paymentForm.date}
                  onChange={(event) => { setPaymentForm((current) => ({ ...current, date: event.target.value })); setPaymentErrors(prev => ({ ...prev, date: undefined })); }}
                  className={`w-full rounded-[1.5rem] border ${paymentErrors.date ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-white/10'} bg-white px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 [color-scheme:light] dark:bg-white/5 dark:text-white dark:[color-scheme:dark] transition-all`}
                />
                {paymentErrors.date && <p className="text-rose-500 text-[10px] font-black mt-1 ml-4 uppercase">{paymentErrors.date}</p>}
              </div>
            </div>
          </div>
        </BottomSheet>

        <Toast message={toast.message} tone={toast.tone} />
      </div>
    </PageTransition>
  );
}
