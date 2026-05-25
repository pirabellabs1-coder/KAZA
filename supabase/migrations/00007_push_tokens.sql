-- ============================================================
-- KAZA - Push Tokens (FCM)
-- ============================================================
-- Stockage des tokens FCM par utilisateur, pour l'envoi de
-- notifications push (Web + iOS + Android). Un utilisateur peut
-- enregistrer plusieurs appareils (téléphone + ordinateur).
-- Le service role est responsable de l'envoi via la table.
-- L'utilisateur final gère uniquement ses propres tokens (RLS).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token         TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  device_info   JSONB DEFAULT '{}'::jsonb,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_token UNIQUE (user_id, token)
);

-- Index partiel : lecture rapide des tokens actifs d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_push_tokens_user
  ON public.user_push_tokens(user_id)
  WHERE enabled = TRUE;

-- ------------------------------------------------------------
-- RLS : chaque utilisateur ne voit/gère que ses tokens
-- ------------------------------------------------------------
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their tokens" ON public.user_push_tokens;
CREATE POLICY "Users manage their tokens"
  ON public.user_push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
