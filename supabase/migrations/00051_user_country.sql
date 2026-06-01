-- =============================================================================
-- KAZA — Pays de l'utilisateur à l'inscription.
--
-- L'inscription capture désormais le PAYS (sélecteur drapeau + indicatif sur le
-- champ téléphone). On stocke l'ISO alpha-2 dans `users.country` et le trigger
-- `handle_new_user` le persiste depuis `raw_user_meta_data->>'country'`.
-- (Déjà appliqué en prod le 2026-06-01 ; consigné ici pour les rebuilds.)
-- =============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
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
  -- NULLIF : téléphone absent/vide => NULL (contrainte UNIQUE users_phone_key).
  user_phone := NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''), '');
  user_country := NULLIF(NEW.raw_user_meta_data->>'country', '');

  IF user_role NOT IN ('OWNER', 'TENANT', 'STUDENT', 'AGENCY', 'ADMIN') THEN
    user_role := 'TENANT';
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
END;
$function$;
