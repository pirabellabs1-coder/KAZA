-- =============================================================================
-- KAZA — Paramètres agence (page publique + notifications)
--
-- Rend persistants les onglets « Page publique » et « Notifications » de
-- /agency/settings, jusqu'ici inertes (defaultValue/defaultChecked sans
-- handler). Stockage : une colonne JSONB unique `agency_settings` sur
-- `public.users`, alimentée par la Server Action `updateAgencySettings`.
--
-- Choix d'implémentation (cohérent avec migration 00026_settings.sql) :
--   - 1 ligne par agence (= 1 utilisateur role='AGENCY'), lecture/écriture
--     atomique avec le profil ;
--   - couvert par la policy RLS existante `users_update_own` — aucune policy
--     supplémentaire requise ;
--   - le schéma applicatif (URL custom, couleur d'accent, réseaux sociaux,
--     canaux de notification par évènement, plage horaire) évolue sans
--     migration.
--
-- ⚠️  Migration NON appliquée automatiquement — à exécuter manuellement via
--     `supabase db push` (ou l'éditeur SQL) après revue.
--
-- Forme attendue du JSONB :
--   {
--     "public": {
--       "slug": "ma-agence",
--       "accentColor": "navy",
--       "about": "...",
--       "youtube": "https://...",
--       "social": { "facebook": "", "instagram": "", "linkedin": "", "twitter": "" },
--       "showTeam": true,
--       "enableReviews": true
--     },
--     "notifications": {
--       "events": { "new_lead": { "email": true, "sms": true, "push": true }, ... },
--       "quietHours": { "start": "08:00", "end": "20:00", "days": [1,2,3,4,5,6] },
--       "digest": "weekly"   -- "daily" | "weekly" | "disabled"
--     }
--   }
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS agency_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.users.agency_settings IS
  'Paramètres agence (page publique + notifications) gérés depuis /agency/settings. Voir migration 00035 pour la forme du JSONB.';
