-- =============================================================================
-- KAZA — Paramètres utilisateurs & plateforme
--
-- Cette migration rend persistants les écrans de paramètres :
--   1. Préférences de notification par catégorie/canal  → users.notification_prefs (JSONB)
--   2. Préférences de confidentialité / RGPD            → users.privacy_prefs (JSONB)
--   3. Demande de suppression de compte (RGPD)          → users.deletion_requested_at
--   4. Paramètres globaux de la plateforme (admin)      → table platform_settings (clé/valeur JSONB)
--
-- Choix d'implémentation pour les préférences notifications/confidentialité :
-- colonnes JSONB sur `public.users` plutôt qu'une table dédiée. Raison :
--   - 1 ligne par utilisateur, lecture/écriture atomique avec le profil
--   - couvert par les policies RLS existantes (`users_update_own`,
--     `users_select_public_profile`) — aucune policy supplémentaire requise
--   - le schéma applicatif (catégories × canaux) évolue sans migration
-- =============================================================================

-- ------------------------------------------------------------
-- 1. Colonnes de préférences sur public.users
-- ------------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_prefs   JSONB        NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS privacy_prefs        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.notification_prefs IS
  'Préférences de notification : { "<categorie>": { "email": bool, "push": bool, "sms": bool }, ... }';
COMMENT ON COLUMN public.users.privacy_prefs IS
  'Préférences de confidentialité/RGPD : { "profileVisibility": "public|tenants|private", "personalizedAds": bool, "shareAnonymizedData": bool, "showActivity": bool }';
COMMENT ON COLUMN public.users.deletion_requested_at IS
  'Horodatage de la demande RGPD de suppression de compte (NULL = aucune demande).';

-- ------------------------------------------------------------
-- 2. Paramètres globaux de la plateforme (admin uniquement)
-- ------------------------------------------------------------
-- Stockage clé/valeur générique : chaque ligne représente un groupe de
-- paramètres (general, payments, notifications, moderation, maintenance, ...).
-- La valeur est un JSONB libre, validé côté Server Action.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.platform_settings IS
  'Paramètres globaux de la plateforme KAZA, gérés depuis /admin/settings. Une ligne par groupe de réglages (key).';

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique : certains réglages (mode maintenance, devise par défaut,
-- nom de la plateforme) doivent être lisibles côté client/serveur sans rôle admin.
DROP POLICY IF EXISTS "platform_settings_public_read" ON public.platform_settings;
CREATE POLICY "platform_settings_public_read" ON public.platform_settings
  FOR SELECT USING (true);

-- Écriture réservée aux ADMIN.
DROP POLICY IF EXISTS "platform_settings_admin_write" ON public.platform_settings;
CREATE POLICY "platform_settings_admin_write" ON public.platform_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.trg_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER tr_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.trg_platform_settings_updated_at();

-- Valeurs par défaut (idempotent) pour que /admin/settings affiche un état cohérent.
INSERT INTO public.platform_settings (key, value) VALUES
  ('general', '{"platformName":"KAZA","contactEmail":"contact@kaza.africa","languages":{"fr":true,"en":false,"fon":false},"currency":"XOF"}'::jsonb),
  ('payments', '{"commission":5,"minPayment":5000,"escrowDays":7}'::jsonb),
  ('notifications', '{"emailNotifs":true,"smsNotifs":true,"pushNotifs":false}'::jsonb),
  ('moderation', '{"autoApprove":false,"reportThreshold":5}'::jsonb),
  ('maintenance', '{"maintenanceMode":false,"maintenanceMessage":"Plateforme en cours de maintenance. Nous serons de retour très bientôt."}'::jsonb)
ON CONFLICT (key) DO NOTHING;
