-- =============================================================================
-- KAZA — Analytics events + tracking page views
-- Permet de mesurer le trafic, les vues d'annonces, conversions, etc.
-- =============================================================================

CREATE TYPE analytics_event_type AS ENUM (
  'PAGE_VIEW', 'PROPERTY_VIEW', 'PROPERTY_CONTACT', 'PROPERTY_FAVORITE',
  'SEARCH_PERFORMED', 'SIGNUP_STARTED', 'SIGNUP_COMPLETED',
  'LOGIN', 'VISIT_REQUESTED', 'BOOKING_INITIATED', 'PAYMENT_COMPLETED',
  'PROPERTY_PUBLISHED', 'PROFILE_COMPLETED', 'OTHER'
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   analytics_event_type NOT NULL,
  user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id   TEXT,
  path         TEXT,
  referrer     TEXT,
  user_agent   TEXT,
  ip_address   TEXT,
  metadata     JSONB,
  country_code TEXT,
  city         TEXT,
  device_type  TEXT, -- mobile / desktop / tablet
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.analytics_events (session_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Insert public (tracking anonyme OK)
DROP POLICY IF EXISTS "analytics_public_insert" ON public.analytics_events;
CREATE POLICY "analytics_public_insert" ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- SELECT admin uniquement (privacy)
DROP POLICY IF EXISTS "analytics_admin_select" ON public.analytics_events;
CREATE POLICY "analytics_admin_select" ON public.analytics_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

-- =============================================================================
-- Trigger incrémente automatiquement properties.views_count à chaque PROPERTY_VIEW
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_property_views()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prop_id UUID;
BEGIN
  IF NEW.event_type = 'PROPERTY_VIEW' AND NEW.metadata ? 'property_id' THEN
    BEGIN
      prop_id := (NEW.metadata->>'property_id')::UUID;
      UPDATE public.properties SET views_count = COALESCE(views_count, 0) + 1
        WHERE id = prop_id;
    EXCEPTION WHEN OTHERS THEN
      -- ignore si pas un UUID valide
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_analytics_property_view ON public.analytics_events;
CREATE TRIGGER on_analytics_property_view
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.increment_property_views();

-- =============================================================================
-- Stats agrégées matérialisées (vues) — calcul à la demande
-- =============================================================================

-- View : compteurs derniers 30j par event_type
CREATE OR REPLACE VIEW public.analytics_30d AS
SELECT
  event_type,
  count(*)::BIGINT AS count,
  count(DISTINCT user_id)::BIGINT AS unique_users,
  count(DISTINCT session_id)::BIGINT AS unique_sessions
FROM public.analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_type;

-- View : sessions par jour 30j
CREATE OR REPLACE VIEW public.analytics_daily_30d AS
SELECT
  date_trunc('day', created_at)::DATE AS day,
  count(DISTINCT session_id)::BIGINT AS sessions,
  count(*)::BIGINT AS events,
  count(*) FILTER (WHERE event_type = 'PAGE_VIEW')::BIGINT AS page_views,
  count(*) FILTER (WHERE event_type = 'PROPERTY_VIEW')::BIGINT AS property_views,
  count(*) FILTER (WHERE event_type = 'SIGNUP_COMPLETED')::BIGINT AS signups
FROM public.analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;
