-- =============================================================================
-- Kaabo — Factures légales émises par les AGENCES à leurs clients (OHADA/Bénin)
--
-- Distinct de `invoices` (factures d'abonnement Kaabo → utilisateur). Ici
-- l'agence facture ses propres prestations (commissions, gestion locative,
-- honoraires…) avec les mentions légales obligatoires : n° séquentiel, TVA,
-- montants HT/TVA/TTC. L'identité de l'émetteur (RCCM, IFU) vient de
-- users.agency_settings.profile.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE agency_invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.agency_invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  number         TEXT NOT NULL,                 -- ex: "2026-0001" (séquentiel/agence)
  client_name    TEXT NOT NULL,
  client_address TEXT,
  client_ifu     TEXT,
  client_email   TEXT,
  issue_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  items          JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{label, qty, unitPrice}]
  subtotal_ht    NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_rate       NUMERIC(5, 2) NOT NULL DEFAULT 18,   -- TVA Bénin 18%
  vat_amount     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_ttc      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'XOF',
  status         agency_invoice_status NOT NULL DEFAULT 'DRAFT',
  notes          TEXT,
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, number)
);

CREATE INDEX IF NOT EXISTS idx_agency_invoices_agency
  ON public.agency_invoices(agency_id, created_at DESC);

ALTER TABLE public.agency_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_invoices_owner_all" ON public.agency_invoices
  FOR ALL USING (auth.uid() = agency_id) WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "agency_invoices_admin_read" ON public.agency_invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );
