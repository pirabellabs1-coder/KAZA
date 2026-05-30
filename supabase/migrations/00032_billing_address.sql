-- =============================================================================
-- KAZA — Adresse de facturation utilisateur
--
-- L'écran /settings/billing proposait un formulaire « Adresse de facturation »
-- qui n'était PAS persisté (simple toast, perte au rechargement). Cette
-- migration ajoute une colonne JSONB `billing_address` sur `public.users` pour
-- rendre ce réglage réellement effectif (persisté + relu).
--
-- Schéma applicatif (validé côté Server Action) :
--   { "name": string, "line1": string, "city": string, "country": string }
--
-- Couvert par les policies RLS existantes (`users_update_own`,
-- `users_select_*`) — aucune policy supplémentaire requise.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS billing_address JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.users.billing_address IS
  'Adresse de facturation : { "name": string, "line1": string, "city": string, "country": string }';
