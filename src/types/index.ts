export interface User {
  id: string;
  email: string;
  name: string | null;
  primary_currency: string;
  financial_month_start_day: number;
  monthly_income: number | null;
  income_type: 'salary' | 'freelance' | 'none';
  zakat_enabled: boolean;
  zakat_anniversary_date: string | null;
  zakat_inputs?: Record<string, unknown> | null;
  gold_grams: number;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  currency: string;
  opening_balance: number;
  is_active: boolean;
  created_at?: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_system: boolean;
  is_islamic: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  merchant_name: string | null;
  description: string | null;
  date: string;
  type: 'income' | 'expense';
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  is_active: boolean;
  category?: Category;
  created_at?: string;
  updated_at?: string;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  frequency: 'monthly' | 'quarterly' | 'annual';
  is_active: boolean;
  next_due_date: string;
  created_at?: string;
  updated_at?: string;
}

export type BillFrequency = 'monthly' | 'quarterly' | 'annual';

export interface OnboardingBill {
  name: string;
  amount: number;
  dueDay: number;
  frequency: BillFrequency;
}

export interface OnboardingData {
  name: string;
  currency: string;
  incomeType: 'salary' | 'freelance' | 'none';
  payDay: number;
  income: number;
  goldGrams: number;
  bills: OnboardingBill[];
  budgetChoice: 'auto' | 'manual';
  zakatEnabled: boolean;
  zakatDate: string | null;
}
