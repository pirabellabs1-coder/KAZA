-- =============================================================================
-- KAZA — Incidents plateforme (page /status publique)
-- =============================================================================

CREATE TYPE incident_severity AS ENUM ('MINOR', 'MAJOR', 'CRITICAL', 'MAINTENANCE');
CREATE TYPE incident_status AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');

CREATE TABLE IF NOT EXISTS public.incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  severity        incident_severity NOT NULL DEFAULT 'MINOR',
  status          incident_status NOT NULL DEFAULT 'INVESTIGATING',
  affected_services TEXT[] DEFAULT ARRAY[]::TEXT[],
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updates         JSONB DEFAULT '[]'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON public.incidents (started_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Lecture publique (page /status est publique)
DROP POLICY IF EXISTS "incidents_public_read" ON public.incidents;
CREATE POLICY "incidents_public_read" ON public.incidents FOR SELECT USING (true);

-- Insert/update admin only
DROP POLICY IF EXISTS "incidents_admin_write" ON public.incidents;
CREATE POLICY "incidents_admin_write" ON public.incidents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "incidents_admin_update" ON public.incidents;
CREATE POLICY "incidents_admin_update" ON public.incidents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- Maintenances planifiées
CREATE TABLE IF NOT EXISTS public.maintenances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status          TEXT NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED
  affected_services TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maintenances_public_read" ON public.maintenances;
CREATE POLICY "maintenances_public_read" ON public.maintenances FOR SELECT USING (true);
DROP POLICY IF EXISTS "maintenances_admin_write" ON public.maintenances;
CREATE POLICY "maintenances_admin_write" ON public.maintenances FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
