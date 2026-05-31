-- =============================================================================
-- KAZA — Codes de vérification email (OTP) pour l'inscription et la
-- réinitialisation de mot de passe.
--
-- Flux par CODE à 6 chiffres (au lieu des liens magiques Supabase) :
--   - SIGNUP : confirme l'email avant création définitive du compte.
--   - RESET  : autorise la définition d'un nouveau mot de passe.
--
-- Le code n'est jamais stocké en clair : seul son HMAC-SHA256 est conservé.
-- RLS activé sans policy → table accessible uniquement via la service role
-- (client admin côté serveur). Jamais exposée au navigateur.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  purpose     TEXT NOT NULL CHECK (purpose IN ('SIGNUP', 'RESET')),
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup
  ON public.email_otps (lower(email), purpose, created_at DESC);

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
-- Aucune policy : seul le service role (client admin) accède à cette table.
