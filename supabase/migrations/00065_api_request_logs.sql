-- =============================================================================
-- Kaabo — Journal des requêtes API (suivi d'utilisation réel)
--
-- Chaque appel à l'API v1 insère une ligne : méthode, chemin, statut HTTP.
-- Permet au développeur de suivre sa consommation réelle dans /developers.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id          BIGSERIAL PRIMARY KEY,
  api_key_id  UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  method      TEXT NOT NULL,
  path        TEXT NOT NULL,
  status      INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_time
  ON public.api_request_logs(user_id, created_at DESC);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_logs_owner_select" ON public.api_request_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "api_logs_admin_select" ON public.api_request_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );
