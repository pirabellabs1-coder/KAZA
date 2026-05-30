-- =============================================================================
-- KAZA — KYC : vérification par email + documents administratifs par rôle
--
-- Évolutions de `identity_verifications` :
--   1. Vérification par EMAIL (et non plus téléphone) → phone_number nullable,
--      ajout de email_verified.
--   2. Documents administratifs additionnels selon le rôle (justificatif de
--      domicile, justificatif étudiant, titre de propriété, etc.) stockés dans
--      extra_documents (JSONB : [{ kind, label, url }]).
-- =============================================================================

-- 1. Téléphone facultatif (la vérification se fait par email).
ALTER TABLE public.identity_verifications
  ALTER COLUMN phone_number DROP NOT NULL;

-- 2. Nouvelles colonnes.
ALTER TABLE public.identity_verifications
  ADD COLUMN IF NOT EXISTS email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS extra_documents JSONB   NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.identity_verifications.email_verified IS
  'Email confirmé (via Supabase Auth email_confirmed_at) au moment de la soumission KYC.';
COMMENT ON COLUMN public.identity_verifications.extra_documents IS
  'Documents administratifs additionnels selon le rôle : [{ kind, label, url }]. '
  'kind ∈ address_proof | student_proof | property_title | business_doc | other.';
