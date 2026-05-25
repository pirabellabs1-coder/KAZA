-- ============================================================
-- KAZA - Identity Verifications
-- Wave 2 - Aminata Traoré
-- ============================================================
-- Tunnel de vérification d'identité (KYC) :
--   1) OTP SMS sur le numéro de téléphone (table `phone_otps`)
--   2) Soumission des pièces (recto/verso) + selfie
--   3) Modération manuelle par un admin (`/admin/verifications`)
--
-- Les fichiers (pièces, selfie) sont stockés dans le bucket
-- privé `identity-documents` de Supabase Storage ; seul le path
-- est persisté ici (pas de copie binaire en DB).
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUM - Type de pièce d'identité
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'id_document_type') THEN
    CREATE TYPE id_document_type AS ENUM (
      'national_id',     -- Carte nationale d'identité
      'passport',        -- Passeport
      'driver_license',  -- Permis de conduire
      'voter_card'       -- Carte d'électeur
    );
  END IF;
END$$;

-- ------------------------------------------------------------
-- 2. TABLE - identity_verifications
-- ------------------------------------------------------------
-- Une seule vérification active par utilisateur (re-soumission =
-- mise à jour de la ligne existante par l'admin). Le statut suit
-- l'enum `verification_status` défini dans 00001 (UNVERIFIED,
-- PENDING, APPROVED, REJECTED).
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type       id_document_type NOT NULL,
  document_number     TEXT,
  document_front_url  TEXT NOT NULL,
  document_back_url   TEXT,
  selfie_url          TEXT NOT NULL,
  phone_number        TEXT NOT NULL,
  phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  status              verification_status NOT NULL DEFAULT 'PENDING',
  rejection_reason    TEXT,
  reviewed_by         UUID REFERENCES public.users(id),
  reviewed_at         TIMESTAMPTZ,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_verif_per_user UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_verif_status
  ON public.identity_verifications(status, submitted_at DESC);

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- L'utilisateur ne voit que sa propre vérification.
CREATE POLICY "Users read their verification" ON public.identity_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- L'utilisateur peut soumettre sa propre vérification.
CREATE POLICY "Users insert their verification" ON public.identity_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les admins lisent toutes les vérifications (file d'attente de modération).
CREATE POLICY "Admins read all" ON public.identity_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Les admins valident/rejettent.
CREATE POLICY "Admins update" ON public.identity_verifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ------------------------------------------------------------
-- 3. TABLE - phone_otps
-- ------------------------------------------------------------
-- Stockage court-terme des OTPs envoyés par SMS (durée de vie 10 min).
-- Le code est stocké hashé en SHA-256 (jamais en clair). La table
-- doit être nettoyée régulièrement par une Edge Function (cron).
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number  TEXT NOT NULL,
  code_hash     TEXT NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user
  ON public.phone_otps(user_id, created_at DESC);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- L'utilisateur ne manipule que ses propres OTPs.
CREATE POLICY "Users access their own OTPs" ON public.phone_otps
  FOR ALL USING (auth.uid() = user_id);
