-- =============================================================================
-- KAZA — Recherches sauvegardées & alertes
--
-- Permet aux utilisateurs de :
--   1. Sauvegarder leurs critères de recherche ("Sauvegarder")
--   2. Créer une alerte e-mail/push sur ces critères ("Alerte")
--
-- Une seule table `saved_searches` couvre les deux usages via la colonne
-- booléenne `is_alert`. Les critères sont stockés en JSONB (pays, ville, type,
-- prix, chambres, q, etc.) afin d'évoluer sans migration.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Ma recherche',
  criteria    JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_alert    BOOLEAN NOT NULL DEFAULT FALSE,
  -- Fréquence de notification pour les alertes : instant | daily | weekly
  frequency   TEXT NOT NULL DEFAULT 'instant',
  last_notified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.saved_searches IS
  'Recherches sauvegardées et alertes immobilières par utilisateur.';
COMMENT ON COLUMN public.saved_searches.criteria IS
  'Critères de recherche en JSON : { country, city, type, minPrice, maxPrice, bedrooms, q, targets }.';
COMMENT ON COLUMN public.saved_searches.is_alert IS
  'TRUE = alerte (notification sur nouveaux biens), FALSE = simple recherche sauvegardée.';

CREATE INDEX IF NOT EXISTS saved_searches_user_idx
  ON public.saved_searches (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_searches_alert_idx
  ON public.saved_searches (is_alert) WHERE is_alert = TRUE;

-- ------------------------------------------------------------
-- RLS : chaque utilisateur gère uniquement ses propres entrées
-- ------------------------------------------------------------
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_searches_select_own ON public.saved_searches;
CREATE POLICY saved_searches_select_own
  ON public.saved_searches FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_searches_insert_own ON public.saved_searches;
CREATE POLICY saved_searches_insert_own
  ON public.saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_searches_update_own ON public.saved_searches;
CREATE POLICY saved_searches_update_own
  ON public.saved_searches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS saved_searches_delete_own ON public.saved_searches;
CREATE POLICY saved_searches_delete_own
  ON public.saved_searches FOR DELETE
  USING (auth.uid() = user_id);
