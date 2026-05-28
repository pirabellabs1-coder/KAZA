-- =============================================================================
-- KAZA — Audit log : trail complet des actions admin sensibles
-- =============================================================================

CREATE TYPE audit_action_type AS ENUM (
  'USER_SUSPENDED', 'USER_BANNED', 'USER_REACTIVATED', 'USER_DELETED',
  'USER_ROLE_CHANGED', 'USER_IMPERSONATED',
  'PROPERTY_APPROVED', 'PROPERTY_REJECTED', 'PROPERTY_HIDDEN', 'PROPERTY_FEATURED',
  'CONTRACT_TERMINATED', 'CONTRACT_VALIDATED',
  'AGENCY_SUSPENDED', 'AGENCY_KYC_APPROVED', 'AGENCY_PLAN_CHANGED',
  'PAYMENT_REFUNDED', 'WALLET_FROZEN', 'WALLET_UNFROZEN',
  'FEATURE_FLAG_TOGGLED', 'EMAIL_TEMPLATE_EDITED',
  'GDPR_EXPORT', 'GDPR_DELETION', 'KYC_APPROVED', 'KYC_REJECTED',
  'OTHER'
);

CREATE TYPE audit_target_type AS ENUM ('USER', 'PROPERTY', 'CONTRACT', 'AGENCY', 'PAYMENT', 'SYSTEM');

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  admin_name    TEXT,
  action        audit_action_type NOT NULL,
  target_type   audit_target_type NOT NULL,
  target_id     TEXT NOT NULL,
  target_label  TEXT,
  reason        TEXT,
  metadata      JSONB,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
