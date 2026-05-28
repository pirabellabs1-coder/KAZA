-- =============================================================================
-- KAZA — Wallets utilisateurs + demandes de retrait
-- Permet aux propriétaires/agences d'encaisser leurs loyers et de demander
-- des virements vers leur compte bancaire ou mobile money.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id       UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance_fcfa  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_in_fcfa  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_out_fcfa NUMERIC(14, 2) NOT NULL DEFAULT 0,
  is_frozen     BOOLEAN NOT NULL DEFAULT false,
  iban          TEXT,
  bank_name     TEXT,
  mobile_money_number TEXT,
  mobile_money_provider TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE wallet_tx_type AS ENUM (
  'RENT_RECEIVED', 'BOOKING_DEPOSIT', 'PAYOUT_REQUESTED', 'PAYOUT_PROCESSED',
  'REFUND_GIVEN', 'PLATFORM_FEE', 'BONUS', 'ADJUSTMENT'
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type         wallet_tx_type NOT NULL,
  amount_fcfa  NUMERIC(14, 2) NOT NULL,
  description  TEXT,
  reference_id UUID,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created_at ON public.wallet_transactions (created_at DESC);

-- Demandes de retrait
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');
CREATE TYPE withdrawal_method AS ENUM ('BANK_TRANSFER', 'MOBILE_MONEY', 'CASH');

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_fcfa     NUMERIC(14, 2) NOT NULL CHECK (amount_fcfa > 0),
  method          withdrawal_method NOT NULL,
  destination     TEXT NOT NULL,
  status          withdrawal_status NOT NULL DEFAULT 'PENDING',
  fee_fcfa        NUMERIC(12, 2) DEFAULT 0,
  net_amount_fcfa NUMERIC(14, 2) NOT NULL,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  processed_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reference       TEXT,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawal_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests (status);

-- Trigger : auto-update wallet balance après chaque transaction
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance_fcfa, total_in_fcfa, total_out_fcfa)
  VALUES (
    NEW.user_id,
    NEW.amount_fcfa,
    CASE WHEN NEW.amount_fcfa > 0 THEN NEW.amount_fcfa ELSE 0 END,
    CASE WHEN NEW.amount_fcfa < 0 THEN -NEW.amount_fcfa ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance_fcfa = user_wallets.balance_fcfa + NEW.amount_fcfa,
    total_in_fcfa = user_wallets.total_in_fcfa + CASE WHEN NEW.amount_fcfa > 0 THEN NEW.amount_fcfa ELSE 0 END,
    total_out_fcfa = user_wallets.total_out_fcfa + CASE WHEN NEW.amount_fcfa < 0 THEN -NEW.amount_fcfa ELSE 0 END,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wallet_tx_insert ON public.wallet_transactions;
CREATE TRIGGER on_wallet_tx_insert
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_self" ON public.user_wallets;
CREATE POLICY "wallets_self" ON public.user_wallets FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "wallet_tx_self" ON public.wallet_transactions;
CREATE POLICY "wallet_tx_self" ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "withdrawals_self" ON public.withdrawal_requests;
CREATE POLICY "withdrawals_self" ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "withdrawals_self_insert" ON public.withdrawal_requests;
CREATE POLICY "withdrawals_self_insert" ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
