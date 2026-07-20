-- =============================================================================
-- Kaabo — Clés API pour l'accès programmatique aux données publiques
--
-- Accès GRATUIT et inclus pour les AGENCES et ADMIN. PAYANT pour les
-- développeurs externes (plan « Kaabo Developer API »). La clé n'est jamais
-- stockée en clair : on conserve son hash SHA-256 + un préfixe d'affichage.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE api_key_tier AS ENUM ('AGENCY', 'DEVELOPER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  key_prefix   TEXT NOT NULL,                 -- ex: "kaabo_live_a1b2" (affichage)
  key_hash     TEXT NOT NULL UNIQUE,          -- SHA-256 de la clé complète
  tier         api_key_tier NOT NULL DEFAULT 'DEVELOPER',
  scopes       TEXT[] NOT NULL DEFAULT ARRAY['properties:read'],
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit   INTEGER NOT NULL DEFAULT 1000, -- requêtes/jour indicatif
  call_count   BIGINT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Le propriétaire de la clé gère ses propres clés.
CREATE POLICY "api_keys_owner_select" ON public.api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "api_keys_owner_insert" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "api_keys_owner_update" ON public.api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Les ADMIN voient toutes les clés (audit).
CREATE POLICY "api_keys_admin_all" ON public.api_keys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Incrément atomique du compteur d'appels (appelé par l'endpoint API).
CREATE OR REPLACE FUNCTION public.touch_api_key(p_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.api_keys
  SET call_count = call_count + 1, last_used_at = now()
  WHERE id = p_id;
$$;

-- Plan payant « Developer API » pour les développeurs externes.
INSERT INTO public.plans (key, name, audience, price_monthly, price_yearly, features, sort_order)
VALUES ('DEVELOPER_API', 'Kaabo Developer API', 'AGENCY', 15000, 150000,
  '["Accès API REST + Webhooks","Jusqu''à 10 000 requêtes/jour","Données publiques des annonces","Support développeur"]'::jsonb, 6)
ON CONFLICT (key) DO NOTHING;
