-- =============================================================================
-- KAZA — Demandes de visite de colocation
--
-- roommate_visit_requests : un étudiant demande à visiter un logement en
-- colocation ; le créateur de l'annonce confirme ou décline.
-- (Les visit_requests classiques sont liées aux `properties` ; les colocations
--  vivent dans `roommate_listings`, d'où cette table dédiée.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.roommate_visit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.roommate_listings(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_date DATE,
  requested_time TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rvr_listing ON public.roommate_visit_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_rvr_requester ON public.roommate_visit_requests(requester_id);

ALTER TABLE public.roommate_visit_requests ENABLE ROW LEVEL SECURITY;

-- Demandeur : CRUD sur ses propres demandes.
DROP POLICY IF EXISTS rvr_requester_own ON public.roommate_visit_requests;
CREATE POLICY rvr_requester_own ON public.roommate_visit_requests
  FOR ALL
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- Créateur de l'annonce : lecture des demandes reçues.
DROP POLICY IF EXISTS rvr_owner_read ON public.roommate_visit_requests;
CREATE POLICY rvr_owner_read ON public.roommate_visit_requests
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM public.roommate_listings WHERE user_id = auth.uid()
    )
  );

-- Créateur de l'annonce : confirmer/décliner.
DROP POLICY IF EXISTS rvr_owner_update ON public.roommate_visit_requests;
CREATE POLICY rvr_owner_update ON public.roommate_visit_requests
  FOR UPDATE
  USING (
    listing_id IN (
      SELECT id FROM public.roommate_listings WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM public.roommate_listings WHERE user_id = auth.uid()
    )
  );
