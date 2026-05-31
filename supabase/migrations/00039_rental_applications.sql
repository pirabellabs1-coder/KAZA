-- =============================================================================
-- KAZA — Candidatures locataires (postuler à une annonce)
--
-- rental_applications : un locataire postule à un bien ; le propriétaire du
-- bien accepte ou refuse. Débloque le parcours candidature côté /tenant et
-- /owner.
--
-- RLS :
--   - le locataire gère ses propres candidatures (tenant_id = auth.uid())
--   - le propriétaire du bien lit + met à jour le statut des candidatures sur
--     ses biens (properties.owner_id = auth.uid()).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
  message TEXT,
  move_in_date DATE,
  monthly_income_fcfa NUMERIC,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rental_applications_property ON public.rental_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_tenant ON public.rental_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status ON public.rental_applications(status);

-- Empêche les doublons de candidature active sur un même bien.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_application
  ON public.rental_applications(property_id, tenant_id)
  WHERE status = 'PENDING';

ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Locataire : CRUD sur ses propres candidatures.
DROP POLICY IF EXISTS applications_tenant_own ON public.rental_applications;
CREATE POLICY applications_tenant_own ON public.rental_applications
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Propriétaire du bien : lecture des candidatures reçues.
DROP POLICY IF EXISTS applications_owner_read ON public.rental_applications;
CREATE POLICY applications_owner_read ON public.rental_applications
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Propriétaire du bien : mise à jour du statut (accepter/refuser).
DROP POLICY IF EXISTS applications_owner_update ON public.rental_applications;
CREATE POLICY applications_owner_update ON public.rental_applications
  FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );
