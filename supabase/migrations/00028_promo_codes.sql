-- =============================================================================
-- KAZA — Codes promo
--
-- Codes de réduction créés par l'admin et applicables aux boosts, abonnements
-- ou réservations. `promo_redemptions` trace chaque utilisation (1 par user).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  description   TEXT,
  -- 'PERCENT' (ex: 20 = -20%) ou 'FIXED' (montant FCFA)
  discount_type TEXT NOT NULL DEFAULT 'PERCENT',
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Périmètre : ALL | BOOST | SUBSCRIPTION | RESERVATION
  applies_to    TEXT NOT NULL DEFAULT 'ALL',
  max_uses      INTEGER,           -- NULL = illimité
  used_count    INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  valid_from    TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until   TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.promo_codes IS 'Codes promo créés par l''admin.';

CREATE INDEX IF NOT EXISTS promo_codes_active_idx
  ON public.promo_codes (is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id    UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  context     TEXT,                       -- BOOST | SUBSCRIPTION | RESERVATION
  amount_discounted NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_redemptions_user_idx
  ON public.promo_redemptions (user_id, promo_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Lecture publique des codes ACTIFS (pour validation côté checkout) ; pas les inactifs.
DROP POLICY IF EXISTS promo_codes_public_select ON public.promo_codes;
CREATE POLICY promo_codes_public_select
  ON public.promo_codes FOR SELECT
  USING (is_active = TRUE OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Création / modification réservée à l'admin.
DROP POLICY IF EXISTS promo_codes_admin_write ON public.promo_codes;
CREATE POLICY promo_codes_admin_write
  ON public.promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- Redemptions : chaque user voit/insère les siennes ; l'admin voit tout.
DROP POLICY IF EXISTS promo_redemptions_select ON public.promo_redemptions;
CREATE POLICY promo_redemptions_select
  ON public.promo_redemptions FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

DROP POLICY IF EXISTS promo_redemptions_insert ON public.promo_redemptions;
CREATE POLICY promo_redemptions_insert
  ON public.promo_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
