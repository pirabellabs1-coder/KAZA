-- =============================================================================
-- KAZA — Partenaires (candidatures) + Messages de contact
-- =============================================================================

CREATE TYPE partner_type AS ENUM (
  'NOTARY', 'BROKER', 'INSURANCE', 'MOVING', 'CLEANING',
  'DECORATION', 'TECHNICAL_AUDIT', 'LEGAL', 'PROPERTY_MGMT', 'OTHER'
);

CREATE TYPE partner_application_status AS ENUM (
  'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
);

CREATE TABLE IF NOT EXISTS public.partner_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  contact_name    TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  partner_type    partner_type NOT NULL,
  city            TEXT,
  country_code    TEXT DEFAULT 'BJ',
  rccm            TEXT,
  website         TEXT,
  description     TEXT,
  status          partner_application_status NOT NULL DEFAULT 'PENDING',
  reviewer_notes  TEXT,
  reviewed_at     TIMESTAMPTZ,
  reviewer_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON public.partner_applications (status);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_apps_self_select" ON public.partner_applications;
CREATE POLICY "partner_apps_self_select" ON public.partner_applications FOR SELECT
  USING (
    auth.uid() = applicant_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "partner_apps_public_insert" ON public.partner_applications;
CREATE POLICY "partner_apps_public_insert" ON public.partner_applications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "partner_apps_admin_update" ON public.partner_applications;
CREATE POLICY "partner_apps_admin_update" ON public.partner_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- =============================================================================
-- Messages de contact public (form /contact)
-- =============================================================================

CREATE TYPE contact_message_status AS ENUM ('NEW', 'READ', 'REPLIED', 'CLOSED');

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  status        contact_message_status NOT NULL DEFAULT 'NEW',
  handled_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reply         TEXT,
  replied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_msg_public_insert" ON public.contact_messages;
CREATE POLICY "contact_msg_public_insert" ON public.contact_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_msg_admin_select" ON public.contact_messages;
CREATE POLICY "contact_msg_admin_select" ON public.contact_messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "contact_msg_admin_update" ON public.contact_messages;
CREATE POLICY "contact_msg_admin_update" ON public.contact_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- =============================================================================
-- Newsletter subscribers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  confirmed     BOOLEAN NOT NULL DEFAULT true,
  unsubscribed  BOOLEAN NOT NULL DEFAULT false,
  source        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_admin_select" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_select" ON public.newsletter_subscribers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
