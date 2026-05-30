-- =============================================================================
-- KAZA — Mandats d'agence & Litiges (cœur B2B agence)
--
-- 1) agency_mandates : contrat de mandat entre une AGENCE et un PROPRIÉTAIRE
--    mandant, autorisant l'agence à gérer/louer un bien contre une commission.
--    Sert de base aux écrans /agency/mandates et au calcul /agency/commissions.
--
-- 2) disputes : signalements / litiges (impayés, dégâts, plaintes) suivis par
--    l'agence, par locataire / bail. Sert l'écran /agency/disputes.
--
-- RLS : l'agence (agency_id = auth.uid()) gère ses propres lignes ; le
-- propriétaire mandant lit ses mandats ; le locataire concerné lit ses litiges.
-- L'admin opère via service role (bypass RLS), comme le reste de l'app.
-- =============================================================================

-- ───────────────────────────── agency_mandates ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.agency_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  mandate_type TEXT NOT NULL DEFAULT 'GESTION'
    CHECK (mandate_type IN ('GESTION', 'LOCATION', 'VENTE', 'EXCLUSIF')),
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10
    CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'EXPIRED')),
  is_exclusive BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  end_date DATE,
  signed_at TIMESTAMPTZ,
  contract_url TEXT,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_mandates_agency ON public.agency_mandates(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_owner ON public.agency_mandates(owner_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_property ON public.agency_mandates(property_id);
CREATE INDEX IF NOT EXISTS idx_agency_mandates_status ON public.agency_mandates(status);

ALTER TABLE public.agency_mandates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mandates_agency_all ON public.agency_mandates;
CREATE POLICY mandates_agency_all ON public.agency_mandates
  FOR ALL
  USING (agency_id = auth.uid())
  WITH CHECK (agency_id = auth.uid());

DROP POLICY IF EXISTS mandates_owner_read ON public.agency_mandates;
CREATE POLICY mandates_owner_read ON public.agency_mandates
  FOR SELECT
  USING (owner_id = auth.uid());

-- ──────────────────────────────── disputes ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rental_id UUID REFERENCES public.rentals(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  dispute_type TEXT NOT NULL DEFAULT 'OTHER'
    CHECK (dispute_type IN ('UNPAID_RENT', 'DAMAGE', 'COMPLAINT', 'NOISE', 'BREACH', 'OTHER')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  title TEXT NOT NULL,
  description TEXT,
  resolution TEXT,
  amount_fcfa NUMERIC,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_agency ON public.disputes(agency_id);
CREATE INDEX IF NOT EXISTS idx_disputes_tenant ON public.disputes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_rental ON public.disputes(rental_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS disputes_agency_all ON public.disputes;
CREATE POLICY disputes_agency_all ON public.disputes
  FOR ALL
  USING (agency_id = auth.uid())
  WITH CHECK (agency_id = auth.uid());

DROP POLICY IF EXISTS disputes_tenant_read ON public.disputes;
CREATE POLICY disputes_tenant_read ON public.disputes
  FOR SELECT
  USING (tenant_id = auth.uid());
