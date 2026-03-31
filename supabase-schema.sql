-- BarakaFlow MVP — Complete Database Schema
-- Safe to run multiple times (uses DROP IF EXISTS + IF NOT EXISTS)

-- =============================================
-- DROP EXISTING (clean slate)
-- =============================================
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =============================================
-- TABLE: users
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  primary_currency TEXT NOT NULL DEFAULT 'AED',
  financial_month_start_day INTEGER NOT NULL DEFAULT 1 CHECK (financial_month_start_day BETWEEN 0 AND 31),
  monthly_income DECIMAL,
  income_type TEXT NOT NULL DEFAULT 'salary',
  zakat_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  zakat_anniversary_date DATE,
  zakat_inputs JSONB,
  gold_grams DECIMAL NOT NULL DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: accounts
-- =============================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Account',
  type TEXT NOT NULL DEFAULT 'cash',
  currency TEXT NOT NULL DEFAULT 'AED',
  opening_balance DECIMAL NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: categories
-- =============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_islamic BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: transactions
-- =============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  amount DECIMAL NOT NULL,
  merchant_name TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: budgets
-- =============================================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  amount DECIMAL NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: bills
-- =============================================
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 0 AND 31),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  next_due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own and system categories" ON public.categories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bills" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bills" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bills" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bills" ON public.bills FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SEED: Default Categories
-- =============================================
INSERT INTO public.categories (name, type, icon, color, is_system, is_islamic, sort_order) VALUES
-- Expenses
('Housing', 'expense', 'Home', '#6366F1', TRUE, FALSE, 1),
('Utilities', 'expense', 'Zap', '#F59E0B', TRUE, FALSE, 2),
('Groceries & Food', 'expense', 'ShoppingCart', '#22C55E', TRUE, FALSE, 3),
('Dining Out', 'expense', 'UtensilsCrossed', '#F97316', TRUE, FALSE, 4),
('Transportation', 'expense', 'Car', '#3B82F6', TRUE, FALSE, 5),
('Healthcare', 'expense', 'Heart', '#EF4444', TRUE, FALSE, 6),
('Education', 'expense', 'GraduationCap', '#8B5CF6', TRUE, FALSE, 7),
('Clothing', 'expense', 'Shirt', '#EC4899', TRUE, FALSE, 8),
('Entertainment', 'expense', 'Gamepad2', '#14B8A6', TRUE, FALSE, 9),
('Subscriptions', 'expense', 'CreditCard', '#6366F1', TRUE, FALSE, 10),
('Government & Fees', 'expense', 'Building', '#64748B', TRUE, FALSE, 11),
('Miscellaneous', 'expense', 'MoreHorizontal', '#94A3B8', TRUE, FALSE, 12),
-- Islamic
('Zakat Al-Mal', 'expense', 'HandCoins', '#10B981', TRUE, TRUE, 13),
('Zakat Al-Fitr', 'expense', 'HandCoins', '#10B981', TRUE, TRUE, 14),
('Sadaqah', 'expense', 'HeartHandshake', '#10B981', TRUE, TRUE, 15),
('Hajj / Umrah', 'expense', 'Plane', '#10B981', TRUE, TRUE, 16),
('Eid Expenses', 'expense', 'Gift', '#10B981', TRUE, TRUE, 17),
-- Income
('Salary', 'income', 'Banknote', '#22C55E', TRUE, FALSE, 1),
('Freelance', 'income', 'Laptop', '#3B82F6', TRUE, FALSE, 2),
('Business Revenue', 'income', 'TrendingUp', '#10B981', TRUE, FALSE, 3),
('Other Income', 'income', 'Plus', '#64748B', TRUE, FALSE, 4);

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_financial_month_start_day_check;
ALTER TABLE public.users ADD CONSTRAINT users_financial_month_start_day_check CHECK (financial_month_start_day BETWEEN 0 AND 31);

ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_due_day_check;
ALTER TABLE public.bills ADD CONSTRAINT bills_due_day_check CHECK (due_day BETWEEN 0 AND 31);

-- =============================================
-- MIGRATIONS / UPDATES
-- =============================================

-- Add zakat_inputs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='zakat_inputs') THEN
        ALTER TABLE public.users ADD COLUMN zakat_inputs JSONB;
    END IF;
END $$;

-- =============================================
-- ANALYTICS (Zero-Knowledge Admin)
-- =============================================

-- Stores daily aggregate counts. No user IDs, no personal data.
CREATE TABLE IF NOT EXISTS public.app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one row per metric per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_date_metric ON public.app_analytics(date, metric);

-- RLS: Nobody can read this from the frontend. Only server-side functions can write to it.
ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

-- Function to increment a daily metric counter (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_metric(metric_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.app_analytics (date, metric, count)
  VALUES (CURRENT_DATE, metric_name, 1)
  ON CONFLICT (date, metric)
  DO UPDATE SET count = public.app_analytics.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (they can increment but never read)
GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT) TO anon;
