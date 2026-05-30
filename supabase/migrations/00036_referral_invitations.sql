-- =============================================================================
-- KAZA — Invitations de parrainage par email
--
-- La table `referrals` (migration 00014) exige `referred_id` NOT NULL (un user
-- déjà inscrit) : elle ne peut donc PAS stocker une invitation envoyée à un
-- email dont le destinataire n'a pas encore de compte.
--
-- Cette migration ajoute `referral_invitations` : 1 ligne par invitation email
-- émise depuis /referral (Server Action `inviteByEmail`). Le destinataire reçoit
-- un vrai email (Resend) avec un lien d'inscription porteur du code de parrainage.
--
-- Flux :
--   PENDING  → invitation envoyée, en attente d'inscription
--   ACCEPTED → le destinataire s'est inscrit avec le code (passage manuel/trigger
--              futur ; pour l'instant la table sert de journal + dédup)
--
-- RLS : l'inviteur (auth.uid() = inviter_id) gère ses propres invitations ;
--       l'admin a accès en lecture.
--
-- ⚠️  Migration NON appliquée automatiquement — exécuter via `supabase db push`
--     (ou l'éditeur SQL) après revue.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.referral_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'PENDING'
              CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  -- Un inviteur ne peut pas spammer le même email plusieurs fois.
  UNIQUE (inviter_id, email)
);

CREATE INDEX IF NOT EXISTS idx_referral_invitations_inviter
  ON public.referral_invitations (inviter_id);
CREATE INDEX IF NOT EXISTS idx_referral_invitations_email
  ON public.referral_invitations (email);

ALTER TABLE public.referral_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refinv_owner_all" ON public.referral_invitations;
CREATE POLICY "refinv_owner_all" ON public.referral_invitations FOR ALL
  USING (auth.uid() = inviter_id)
  WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "refinv_admin_read" ON public.referral_invitations;
CREATE POLICY "refinv_admin_read" ON public.referral_invitations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

COMMENT ON TABLE public.referral_invitations IS
  'Invitations de parrainage par email émises depuis /referral (Server Action inviteByEmail). Journal + déduplication. Voir migration 00036.';
