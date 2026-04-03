-- =============================================
-- BarakaFlow — Complete Database Schema + Functions + Indexes
-- Run this ONCE in Supabase SQL Editor for a clean install.
-- WARNING: Drops all existing app tables first.
-- =============================================

-- =============================================
-- DROP EXISTING TABLES (child → parent order)
-- =============================================
DROP TABLE IF EXISTS public.app_analytics CASCADE;
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP FUNCTION IF EXISTS public.increment_metric(TEXT);
DROP FUNCTION IF EXISTS public.pay_bill(UUID, UUID, DECIMAL, DATE, UUID, TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =============================================
-- TABLE: users
-- =============================================
CREATE TABLE public.users (
  id                          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                       TEXT        NOT NULL,
  name                        TEXT,
  primary_currency            TEXT        NOT NULL DEFAULT 'AED',
  financial_month_start_day   INTEGER     NOT NULL DEFAULT 1 CHECK (financial_month_start_day BETWEEN 0 AND 31),
  monthly_income              DECIMAL,
  income_type                 TEXT        NOT NULL DEFAULT 'salary',
  zakat_enabled               BOOLEAN     NOT NULL DEFAULT FALSE,
  zakat_anniversary_date      DATE,
  zakat_inputs                JSONB,
  gold_grams                  DECIMAL     NOT NULL DEFAULT 0,
  onboarding_completed        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: accounts
-- =============================================
CREATE TABLE public.accounts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL DEFAULT 'Main Account',
  type             TEXT        NOT NULL DEFAULT 'cash',
  currency         TEXT        NOT NULL DEFAULT 'AED',
  opening_balance  DECIMAL     NOT NULL DEFAULT 0,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: categories
-- =============================================
CREATE TABLE public.categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  icon        TEXT        NOT NULL,
  color       TEXT        NOT NULL,
  is_system   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_islamic  BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: transactions
-- =============================================
CREATE TABLE public.transactions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id     UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id    UUID        NOT NULL REFERENCES public.categories(id),
  amount         DECIMAL     NOT NULL,
  merchant_name  TEXT,
  description    TEXT,
  date           DATE        NOT NULL DEFAULT CURRENT_DATE,
  type           TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: budgets
-- =============================================
CREATE TABLE public.budgets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id  UUID        NOT NULL REFERENCES public.categories(id),
  amount       DECIMAL     NOT NULL,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id)
);

-- =============================================
-- TABLE: bills
-- =============================================
CREATE TABLE public.bills (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  amount         DECIMAL     NOT NULL,
  due_day        INTEGER     NOT NULL CHECK (due_day BETWEEN 0 AND 31),
  frequency      TEXT        NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  next_due_date  DATE        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: app_analytics (zero-knowledge aggregates)
-- =============================================
CREATE TABLE public.app_analytics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  metric      TEXT        NOT NULL,
  count       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, metric)
);

-- =============================================
-- INDEXES — Performance
-- =============================================

CREATE INDEX idx_transactions_user_date      ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_type_date ON public.transactions(user_id, type, date DESC);
CREATE INDEX idx_transactions_user_category  ON public.transactions(user_id, category_id);
CREATE INDEX idx_budgets_user_active         ON public.budgets(user_id, is_active);
CREATE INDEX idx_bills_user_active           ON public.bills(user_id, is_active, next_due_date);
CREATE INDEX idx_accounts_user_active        ON public.accounts(user_id, is_active);
CREATE INDEX idx_categories_system           ON public.categories(is_system, type);
CREATE INDEX idx_categories_user             ON public.categories(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_select" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bills_select" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bills_insert" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bills_update" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bills_delete" ON public.bills FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCTION: increment_metric (analytics counter)
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_metric(metric_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.app_analytics (date, metric, count)
  VALUES (CURRENT_DATE, metric_name, 1)
  ON CONFLICT (date, metric)
  DO UPDATE SET count = public.app_analytics.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT) TO anon;

-- =============================================
-- FUNCTION: pay_bill (atomic bill payment)
-- =============================================
CREATE OR REPLACE FUNCTION public.pay_bill(
  p_bill_id UUID,
  p_account_id UUID,
  p_amount DECIMAL,
  p_payment_date DATE,
  p_category_id UUID,
  p_description TEXT DEFAULT 'Bill Payment'
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.bills WHERE id = p_bill_id;

  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized or Bill not found';
  END IF;

  INSERT INTO public.transactions (
    user_id, account_id, category_id, amount, type, date, description
  ) VALUES (
    v_user_id, p_account_id, p_category_id, -ABS(p_amount), 'expense', p_payment_date, p_description
  );

  UPDATE public.bills
  SET next_due_date = (
    CASE
      WHEN frequency = 'monthly'   THEN next_due_date + INTERVAL '1 month'
      WHEN frequency = 'quarterly' THEN next_due_date + INTERVAL '3 months'
      WHEN frequency = 'annual'    THEN next_due_date + INTERVAL '1 year'
      ELSE next_due_date + INTERVAL '1 month'
    END
  )::DATE,
  updated_at = NOW()
  WHERE id = p_bill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.pay_bill(UUID, UUID, DECIMAL, DATE, UUID, TEXT) TO authenticated;

-- =============================================
-- FUNCTION + TRIGGER: Auto-create user profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED: System Categories
-- =============================================
INSERT INTO public.categories (name, type, icon, color, is_system, is_islamic, sort_order) VALUES
('Housing',           'expense', 'Home',            '#6366F1', TRUE, FALSE,  1),
('Utilities',         'expense', 'Zap',             '#F59E0B', TRUE, FALSE,  2),
('Groceries & Food',  'expense', 'ShoppingCart',    '#22C55E', TRUE, FALSE,  3),
('Dining Out',        'expense', 'UtensilsCrossed', '#F97316', TRUE, FALSE,  4),
('Transportation',    'expense', 'Car',             '#3B82F6', TRUE, FALSE,  5),
('Healthcare',        'expense', 'Heart',           '#EF4444', TRUE, FALSE,  6),
('Education',         'expense', 'GraduationCap',   '#8B5CF6', TRUE, FALSE,  7),
('Clothing',          'expense', 'Shirt',           '#EC4899', TRUE, FALSE,  8),
('Entertainment',     'expense', 'Gamepad2',        '#14B8A6', TRUE, FALSE,  9),
('Subscriptions',     'expense', 'CreditCard',      '#6366F1', TRUE, FALSE, 10),
('Government & Fees', 'expense', 'Building',        '#64748B', TRUE, FALSE, 11),
('Miscellaneous',     'expense', 'MoreHorizontal',  '#94A3B8', TRUE, FALSE, 12),
('Zakat Al-Mal',      'expense', 'HandCoins',       '#10B981', TRUE, TRUE,  13),
('Zakat Al-Fitr',     'expense', 'HandCoins',       '#10B981', TRUE, TRUE,  14),
('Sadaqah',           'expense', 'HeartHandshake',  '#10B981', TRUE, TRUE,  15),
('Hajj / Umrah',      'expense', 'Plane',           '#10B981', TRUE, TRUE,  16),
('Eid Expenses',      'expense', 'Gift',            '#10B981', TRUE, TRUE,  17),
('Salary',            'income',  'Banknote',        '#22C55E', TRUE, FALSE,  1),
('Freelance',         'income',  'Laptop',          '#3B82F6', TRUE, FALSE,  2),
('Business Revenue',  'income',  'TrendingUp',      '#10B981', TRUE, FALSE,  3),
('Other Income',      'income',  'Plus',            '#64748B', TRUE, FALSE,  4);

-- =============================================
-- BACKFILL: Create profiles + accounts for existing auth users
-- (The trigger only fires on NEW signups, so anyone who
--  already had an auth account before this schema ran
--  would be missing their public.users row.)
-- =============================================
INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.accounts (user_id, name, type, currency)
SELECT u.id, 'Main Account', 'cash', 'AED'
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounts a WHERE a.user_id = u.id
);
