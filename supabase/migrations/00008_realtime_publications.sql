-- =============================================================================
-- KAZA - Activation des publications Realtime
-- Wave 3 - Nia
--
-- Supabase Realtime requiert que chaque table soit ajoutée à la publication
-- `supabase_realtime` pour pouvoir s'y abonner via Postgres Changes.
--
-- Cette migration active Realtime sur :
--   - messages              (messagerie temps réel)
--   - notifications         (centre de notifs in-app)
--   - visit_requests        (demandes de visite)
--   - identity_verifications (suivi modération)
--   - contracts             (suivi signatures)
-- =============================================================================

-- Sécurité : on retire d'abord les tables potentiellement déjà ajoutées,
-- puis on (re)les ajoute, pour rendre la migration idempotente.
DO $$
DECLARE
  tbl TEXT;
  tables_to_publish TEXT[] := ARRAY[
    'messages',
    'notifications',
    'visit_requests',
    'identity_verifications',
    'contracts'
  ];
BEGIN
  -- Crée la publication si elle n'existe pas (Supabase la crée par défaut, mais
  -- on est défensif pour les environnements custom).
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH tbl IN ARRAY tables_to_publish
  LOOP
    -- Vérifie que la table existe avant tentative (les migrations 00004-00006
    -- doivent avoir tourné en amont).
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Retire silencieusement si déjà publiée.
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', tbl);
      EXCEPTION WHEN OTHERS THEN
        -- pas publiée → on continue
        NULL;
      END;

      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- Note : Realtime respecte les politiques RLS. Une session ne reçoit un
-- payload INSERT/UPDATE/DELETE que si la policy SELECT correspondante laisse
-- voir la ligne à l'utilisateur authentifié.
