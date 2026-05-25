-- ============================================================
-- KAZA - Notifications
-- ============================================================
-- Table de notifications utilisateurs (visites, messages,
-- paiements, modération de propriétés, contrats, avis, KYC).
-- Les insertions sont réservées au service role (Edge Functions
-- ou server actions admin) : aucune policy INSERT publique.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUM
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'visit_request', 'visit_accepted', 'visit_rejected',
      'message_received',
      'payment_received', 'payment_failed', 'payment_due',
      'property_approved', 'property_rejected', 'property_suspended',
      'contract_ready', 'contract_signed',
      'review_received',
      'identity_approved', 'identity_rejected',
      'system'
    );
  END IF;
END$$;

-- ------------------------------------------------------------
-- 2. TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. INDEX
-- ------------------------------------------------------------
-- Lecture rapide du badge "non lues" par utilisateur
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Lecture chronologique complète (centre de notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own notifications" ON public.notifications;
CREATE POLICY "Users see their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own notifications" ON public.notifications;
CREATE POLICY "Users update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own notifications" ON public.notifications;
CREATE POLICY "Users delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Insertions via service role uniquement : aucune policy INSERT.
