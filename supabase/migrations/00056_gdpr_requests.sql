-- =============================================================================
-- KAZA — Demandes RGPD / APDP (protection des données)
--
-- Un utilisateur connecté peut exercer ses droits (RGPD art. 15-22, loi APDP
-- du Bénin) en soumettant une demande : EXPORT (portabilité), DELETION
-- (effacement), RECTIFICATION ou ACCESS. L'administrateur consulte et traite
-- ces demandes (délai légal de réponse : 30 jours).
--
-- Additif et non-breaking.
-- =============================================================================

-- 1) Table -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('EXPORT','DELETION','RECTIFICATION','ACCESS')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','REJECTED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  admin_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user ON public.gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON public.gdpr_requests(status);

-- 2) RLS ---------------------------------------------------------------------
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- INSERT : un utilisateur connecté crée une demande pour lui-même.
DROP POLICY IF EXISTS gdpr_requests_insert_own ON public.gdpr_requests;
CREATE POLICY gdpr_requests_insert_own ON public.gdpr_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- SELECT : le demandeur voit ses demandes, l'ADMIN voit tout.
DROP POLICY IF EXISTS gdpr_requests_select_own_or_admin ON public.gdpr_requests;
CREATE POLICY gdpr_requests_select_own_or_admin ON public.gdpr_requests
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- UPDATE : ADMIN uniquement (traitement : statut, resolved_at/by, admin_note).
DROP POLICY IF EXISTS gdpr_requests_update_admin ON public.gdpr_requests;
CREATE POLICY gdpr_requests_update_admin ON public.gdpr_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
