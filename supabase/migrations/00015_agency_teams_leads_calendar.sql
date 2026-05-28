-- =============================================================================
-- KAZA — Tables équipe agence + leads CRM + calendrier multi-agents
-- =============================================================================

-- 1. AGENCY TEAMS — membres rattachés à une agence
CREATE TYPE agency_role AS ENUM ('DIRECTOR', 'MANAGER', 'AGENT_SENIOR', 'AGENT', 'INTERN', 'ACCOUNTANT');
CREATE TYPE agency_member_status AS ENUM ('ACTIVE', 'ON_LEAVE', 'INVITED', 'REMOVED');

CREATE TABLE IF NOT EXISTS public.agency_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  full_name     TEXT NOT NULL,
  role          agency_role NOT NULL DEFAULT 'AGENT',
  status        agency_member_status NOT NULL DEFAULT 'INVITED',
  phone         TEXT,
  permissions   TEXT[] DEFAULT ARRAY['properties','visits'],
  hired_at      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_members_agency_id ON public.agency_members (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_member_id ON public.agency_members (member_id);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_members_owner_all" ON public.agency_members;
CREATE POLICY "agency_members_owner_all" ON public.agency_members FOR ALL
  USING (
    auth.uid() = agency_id
    OR auth.uid() = member_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    auth.uid() = agency_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 2. LEADS — CRM agence
CREATE TYPE lead_stage AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED', 'OFFER', 'WON', 'LOST');
CREATE TYPE lead_source AS ENUM ('SITE_KAZA', 'SOCIAL', 'WORD_OF_MOUTH', 'GOOGLE_ADS', 'EVENT', 'OTHER');

CREATE TABLE IF NOT EXISTS public.agency_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to     UUID REFERENCES public.agency_members(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  source          lead_source NOT NULL DEFAULT 'SITE_KAZA',
  budget_fcfa     NUMERIC(12, 2),
  property_id     UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  stage           lead_stage NOT NULL DEFAULT 'NEW',
  notes           TEXT,
  score           INTEGER DEFAULT 50,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_agency_id ON public.agency_leads (agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.agency_leads (stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.agency_leads (assigned_to);

ALTER TABLE public.agency_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_agency_all" ON public.agency_leads;
CREATE POLICY "leads_agency_all" ON public.agency_leads FOR ALL
  USING (
    auth.uid() = agency_id
    OR EXISTS (SELECT 1 FROM public.agency_members WHERE agency_id = agency_leads.agency_id AND member_id = auth.uid() AND status = 'ACTIVE')
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 3. CALENDAR EVENTS — agenda multi-agents
CREATE TYPE calendar_event_type AS ENUM ('VISIT', 'SIGNATURE', 'MEETING', 'INSPECTION', 'OTHER');

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to   UUID REFERENCES public.agency_members(id) ON DELETE SET NULL,
  property_id   UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  lead_id       UUID REFERENCES public.agency_leads(id) ON DELETE SET NULL,
  visit_id      UUID REFERENCES public.visit_requests(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  type          calendar_event_type NOT NULL DEFAULT 'VISIT',
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  contact_name  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_events_agency_id ON public.calendar_events (agency_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_start_at ON public.calendar_events (start_at);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cal_events_agency_all" ON public.calendar_events;
CREATE POLICY "cal_events_agency_all" ON public.calendar_events FOR ALL
  USING (
    auth.uid() = agency_id
    OR EXISTS (SELECT 1 FROM public.agency_members WHERE agency_id = calendar_events.agency_id AND member_id = auth.uid() AND status = 'ACTIVE')
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );
