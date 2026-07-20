-- =============================================================================
-- Kaabo — Webhooks : notifications HTTP sortantes vers les développeurs/agences
--
-- Chaque endpoint reçoit un POST signé (HMAC-SHA256, en-tête X-Kaabo-Signature)
-- à chaque événement souscrit. Le secret sert à vérifier l'authenticité.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  secret           TEXT NOT NULL,                 -- secret de signature (whsec_...)
  events           TEXT[] NOT NULL DEFAULT ARRAY['property.created'],
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  description      TEXT,
  last_delivery_at TIMESTAMPTZ,
  last_status      INTEGER,
  failure_count    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhook_endpoints(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON public.webhook_endpoints(is_active);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_owner_select" ON public.webhook_endpoints
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "webhooks_owner_insert" ON public.webhook_endpoints
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "webhooks_owner_update" ON public.webhook_endpoints
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "webhooks_admin_all" ON public.webhook_endpoints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );
