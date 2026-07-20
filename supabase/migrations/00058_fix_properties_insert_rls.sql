-- =============================================================================
-- 00058 — Corrige la RLS d'insertion des annonces (properties)
-- =============================================================================
-- L'ancienne policy exigeait role='OWNER' ET verification_status='APPROVED',
-- ce qui bloquait : les AGENCES, les ADMIN, et tout propriétaire non encore
-- vérifié — alors que la modération se fait déjà via le statut (PENDING_REVIEW).
-- Nouvelle policy : OWNER / AGENCY / ADMIN peuvent créer LEURS propres annonces.
-- =============================================================================

DROP POLICY IF EXISTS properties_insert_verified_owner ON public.properties;

CREATE POLICY properties_insert_owner_agency ON public.properties
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('OWNER','AGENCY','ADMIN')
    )
  );
