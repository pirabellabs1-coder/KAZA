-- =============================================================================
-- KAZA — Tables pour finaliser la plateforme (issues audit 100/100)
--   1. reports         : signalements de contenu (annonce/avis/utilisateur/message)
--   2. refund_requests : demandes de remboursement (suivi + audit)
--   3. feature_flags   : flags pilotes cote serveur (persistants, partages admin)
--   4. email_templates : modeles d'email editables par l'admin
--   5. property_boosts : boosts d'annonce payes et persistes
-- =============================================================================

-- 1. SIGNALEMENTS -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_type  TEXT NOT NULL,          -- property | review | user | message | other
  target_id    TEXT,
  reason       TEXT NOT NULL,          -- fake | fraud | inappropriate | spam | other
  details      TEXT,
  status       TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | REVIEWED | RESOLVED | DISMISSED
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID REFERENCES public.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status, created_at DESC);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reports_insert ON public.reports;
CREATE POLICY reports_insert ON public.reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS reports_select ON public.reports;
CREATE POLICY reports_select ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
DROP POLICY IF EXISTS reports_admin_update ON public.reports;
CREATE POLICY reports_admin_update ON public.reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- 2. DEMANDES DE REMBOURSEMENT ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   UUID,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  decision_note TEXT
);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON public.refund_requests (status, created_at DESC);
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS refund_insert ON public.refund_requests;
CREATE POLICY refund_insert ON public.refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS refund_select ON public.refund_requests;
CREATE POLICY refund_select ON public.refund_requests FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
DROP POLICY IF EXISTS refund_admin_update ON public.refund_requests;
CREATE POLICY refund_admin_update ON public.refund_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- 3. FEATURE FLAGS ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key          TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  rollout      INTEGER NOT NULL DEFAULT 100,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS flags_public_select ON public.feature_flags;
CREATE POLICY flags_public_select ON public.feature_flags FOR SELECT USING (true);
DROP POLICY IF EXISTS flags_admin_write ON public.feature_flags;
CREATE POLICY flags_admin_write ON public.feature_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- 4. EMAIL TEMPLATES ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_templates (
  key          TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body_html    TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_templates_admin ON public.email_templates;
CREATE POLICY email_templates_admin ON public.email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- 5. BOOSTS D'ANNONCE ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_boosts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan         TEXT NOT NULL,           -- featured | premium | top
  amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  starts_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at      TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | EXPIRED | CANCELLED
  payment_id   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS property_boosts_active_idx ON public.property_boosts (property_id, status, ends_at);
ALTER TABLE public.property_boosts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS boosts_owner_select ON public.property_boosts;
CREATE POLICY boosts_owner_select ON public.property_boosts FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
DROP POLICY IF EXISTS boosts_owner_insert ON public.property_boosts;
CREATE POLICY boosts_owner_insert ON public.property_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);
