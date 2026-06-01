-- =============================================================================
-- KAZA — Vente de biens (listing_type SALE + offres d'achat)
--
-- Modèle retenu : ACOMPTE + CLÔTURE NOTAIRE (conforme OHADA).
--   - Un bien peut être « À louer » (RENT, défaut) ou « À vendre » (SALE).
--   - Un acheteur fait une OFFRE sur un bien SALE (property_offers).
--   - Le vendeur accepte/refuse ; à l'acceptation l'acheteur verse un ACOMPTE
--     de réservation (Mobile Money) qui bloque le bien (status RESERVED).
--   - La vente finale se conclut hors-ligne chez le notaire ; le vendeur passe
--     alors le bien à SOLD.
--
-- Additif et non-breaking : les biens existants restent RENT par défaut.
-- =============================================================================

-- 1) Nouveaux états de bien (réservé / vendu) -------------------------------
ALTER TYPE public.property_status ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE public.property_status ADD VALUE IF NOT EXISTS 'SOLD';

-- 2) Type de transaction du bien --------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') THEN
    CREATE TYPE public.listing_type AS ENUM ('RENT', 'SALE');
  END IF;
END$$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_type public.listing_type NOT NULL DEFAULT 'RENT';

CREATE INDEX IF NOT EXISTS idx_properties_listing_type
  ON public.properties(listing_type);

-- 3) Offres d'achat ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Montant proposé par l'acheteur (FCFA).
  amount_fcfa NUMERIC(16,2) NOT NULL,
  -- Acompte de réservation attendu/versé (FCFA).
  deposit_fcfa NUMERIC(16,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN (
      'PENDING',      -- offre soumise, en attente du vendeur
      'ACCEPTED',     -- vendeur a accepté, en attente de l'acompte
      'REJECTED',     -- vendeur a refusé
      'DEPOSIT_PAID', -- acompte versé, bien réservé
      'CLOSED',       -- vente conclue (notaire) — bien vendu
      'CANCELLED',    -- annulée (autre offre retenue / bien retiré)
      'WITHDRAWN'     -- retirée par l'acheteur
    )),
  message TEXT,
  decided_at TIMESTAMPTZ,
  deposit_paid_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_offers_property ON public.property_offers(property_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_buyer ON public.property_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_status ON public.property_offers(status);

-- Une seule offre active par (bien, acheteur).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_offer
  ON public.property_offers(property_id, buyer_id)
  WHERE status IN ('PENDING', 'ACCEPTED', 'DEPOSIT_PAID');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_property_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_offers_updated_at ON public.property_offers;
CREATE TRIGGER trg_property_offers_updated_at
  BEFORE UPDATE ON public.property_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_property_offers_updated_at();

-- RLS ------------------------------------------------------------------------
ALTER TABLE public.property_offers ENABLE ROW LEVEL SECURITY;

-- Acheteur : CRUD sur ses propres offres.
DROP POLICY IF EXISTS offers_buyer_own ON public.property_offers;
CREATE POLICY offers_buyer_own ON public.property_offers
  FOR ALL
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- Vendeur (propriétaire du bien) : lecture des offres reçues.
DROP POLICY IF EXISTS offers_owner_read ON public.property_offers;
CREATE POLICY offers_owner_read ON public.property_offers
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Vendeur : mise à jour du statut (accepter/refuser/clôturer).
DROP POLICY IF EXISTS offers_owner_update ON public.property_offers;
CREATE POLICY offers_owner_update ON public.property_offers
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
