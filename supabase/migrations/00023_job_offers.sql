-- =============================================================================
-- KAZA — Offres d'emploi (page /carrieres administrable)
--
-- Permet aux ADMIN de publier, modifier, fermer des offres d'emploi qui sont
-- ensuite consultables publiquement sur /carrieres et /carrieres/[slug].
-- Les visiteurs ne voient que les offres `PUBLISHED`.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE job_offer_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_offer_contract AS ENUM ('CDI', 'CDD', 'STAGE', 'FREELANCE', 'ALTERNANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.job_offers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  department   TEXT NOT NULL,        -- ex: Engineering, Product, Ops, Sales
  location     TEXT NOT NULL,        -- ex: Cotonou, Remote, Abidjan
  contract     job_offer_contract NOT NULL DEFAULT 'CDI',
  level        TEXT,                 -- ex: Junior, Mid, Senior, Lead
  summary      TEXT NOT NULL,        -- 1-2 phrases
  description  TEXT NOT NULL,        -- markdown long
  requirements TEXT,                 -- markdown
  benefits     TEXT,                 -- markdown
  salary_range TEXT,                 -- ex: "800k-1.2M FCFA / mois"
  apply_email  TEXT NOT NULL DEFAULT 'careers@kaza.africa',
  status       job_offer_status NOT NULL DEFAULT 'DRAFT',
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_offers_status ON public.job_offers (status);
CREATE INDEX IF NOT EXISTS idx_job_offers_slug   ON public.job_offers (slug);
CREATE INDEX IF NOT EXISTS idx_job_offers_published_at
  ON public.job_offers (published_at DESC) WHERE status = 'PUBLISHED';

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

-- Lecture publique des offres PUBLISHED
DROP POLICY IF EXISTS "job_offers_public_read" ON public.job_offers;
CREATE POLICY "job_offers_public_read" ON public.job_offers
  FOR SELECT USING (status = 'PUBLISHED');

-- Les ADMIN ont tous les droits (SELECT inclus toutes les offres)
DROP POLICY IF EXISTS "job_offers_admin_all" ON public.job_offers;
CREATE POLICY "job_offers_admin_all" ON public.job_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trg_job_offers_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_job_offers_updated_at ON public.job_offers;
CREATE TRIGGER tr_job_offers_updated_at BEFORE UPDATE ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION trg_job_offers_updated_at();
