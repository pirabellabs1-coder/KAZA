-- =============================================================================
-- KAZA — Subscription billing attempts (wallet-based)
--
-- Trace chaque tentative de facturation d'un abonnement contre le wallet de
-- l'utilisateur. Statuts : PENDING (créé), SUCCESS (wallet débité),
-- INSUFFICIENT_FUNDS (solde insuffisant), FAILED (autre erreur).
--
-- Ajoute aussi la valeur SUBSCRIPTION_DEBIT à l'enum wallet_tx_type pour
-- distinguer les débits d'abonnement des autres mouvements de wallet.
-- =============================================================================

-- Étendre l'enum wallet_tx_type (00019) pour les débits d'abonnement
ALTER TYPE wallet_tx_type ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_DEBIT';

-- Statuts possibles d'une tentative de facturation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_attempt_status') THEN
    CREATE TYPE billing_attempt_status AS ENUM ('PENDING','SUCCESS','INSUFFICIENT_FUNDS','FAILED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.subscription_billing_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_fcfa     NUMERIC(12,2) NOT NULL,
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  status          billing_attempt_status NOT NULL DEFAULT 'PENDING',
  attempted_at    TIMESTAMPTZ,
  wallet_tx_id    UUID,
  failure_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_attempts_subscription
  ON public.subscription_billing_attempts(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_attempts_status
  ON public.subscription_billing_attempts(status);

ALTER TABLE public.subscription_billing_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_attempts_own_read" ON public.subscription_billing_attempts;
CREATE POLICY "billing_attempts_own_read"
  ON public.subscription_billing_attempts
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "billing_attempts_admin_all" ON public.subscription_billing_attempts;
CREATE POLICY "billing_attempts_admin_all"
  ON public.subscription_billing_attempts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );
