-- =============================================================================
-- 00064 — Rôle DEVELOPER (inscription développeur / API)
-- =============================================================================
-- Ajoute le rôle 'DEVELOPER' à l'enum user_role et l'autorise dans le trigger
-- d'inscription. Les développeurs disposent d'un espace dédié (/developers)
-- pour gérer leurs clés API, webhooks et suivre leur consommation.
-- =============================================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'DEVELOPER';

-- (Le CREATE OR REPLACE de handle_new_user est appliqué séparément, après le
--  commit de l'ajout de valeur d'enum.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  user_role TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_phone TEXT;
  user_country TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'TENANT');
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  user_phone := NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''), '');
  user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');

  IF user_role NOT IN ('OWNER','TENANT','STUDENT','AGENCY','ADMIN','BUYER','DEVELOPER') THEN
    user_role := 'TENANT';
  END IF;

  IF user_phone IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.users WHERE phone = user_phone) THEN
    user_phone := NULL;
  END IF;

  INSERT INTO public.users (
    id, email, first_name, last_name, phone, country, role, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, user_first_name, user_last_name, user_phone, user_country,
    user_role::user_role, NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'handle_new_user: conflit unique ignore pour %', NEW.email;
  RETURN NEW;
END;
$fn$;
