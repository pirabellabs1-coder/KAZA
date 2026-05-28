-- =============================================================================
-- KAZA — Abonnements (KAZA Pro pour agences, KAZA Plus pour locataires)
-- =============================================================================

CREATE TYPE subscription_plan AS ENUM (
  'PRO_STARTER', 'PRO_PREMIUM', 'PRO_ELITE',
  'PLUS_MONTHLY', 'PLUS_YEARLY'
);

CREATE TYPE subscription_status AS ENUM (
  'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan          subscription_plan NOT NULL,
  status        subscription_status NOT NULL DEFAULT 'TRIAL',
  monthly_price NUMERIC(12, 2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'XOF',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  cancelled_at  TIMESTAMPTZ,
  payment_method TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);

-- =============================================================================
-- Factures associées aux abonnements
-- =============================================================================

CREATE TYPE invoice_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  number          TEXT UNIQUE NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'XOF',
  status          invoice_status NOT NULL DEFAULT 'PENDING',
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  due_date        TIMESTAMPTZ,
  description     TEXT,
  payment_method  TEXT,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices (subscription_id);

-- =============================================================================
-- RLS — chacun voit ses propres subscriptions/invoices ; admin voit tout
-- =============================================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_owner_select" ON public.subscriptions;
CREATE POLICY "subscriptions_owner_select"
  ON public.subscriptions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "subscriptions_owner_insert" ON public.subscriptions;
CREATE POLICY "subscriptions_owner_insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_owner_update" ON public.subscriptions;
CREATE POLICY "subscriptions_owner_update"
  ON public.subscriptions FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "invoices_owner_select" ON public.invoices;
CREATE POLICY "invoices_owner_select"
  ON public.invoices FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "invoices_owner_insert" ON public.invoices;
CREATE POLICY "invoices_owner_insert"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);
