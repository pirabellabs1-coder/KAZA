-- =============================================================================
-- KAZA — Campagnes de communication (admin)
-- Persistance des campagnes email/push/in-app + suivi des envois.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE campaign_channel AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'SMS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  channel       campaign_channel NOT NULL DEFAULT 'IN_APP',
  segment       TEXT NOT NULL DEFAULT 'ALL',  -- clé du segment d'audience
  subject       TEXT,                          -- objet (email)
  content       TEXT NOT NULL,
  status        campaign_status NOT NULL DEFAULT 'DRAFT',
  audience_size INTEGER NOT NULL DEFAULT 0,
  sent_count    INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_admin_all" ON public.campaigns;
CREATE POLICY "campaigns_admin_all" ON public.campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );
