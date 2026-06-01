-- =============================================================================
-- KAZA — Fix « Database error creating new user » à l'inscription.
--
-- Cause : `users.phone` porte une contrainte UNIQUE (`users_phone_key`), mais le
-- trigger `handle_new_user` faisait `COALESCE(..., '')` → toute inscription SANS
-- téléphone insérait la chaîne vide ''. Le 1er compte sans tél passait, mais
-- TOUS les suivants violaient la contrainte unique (duplicate key, phone='').
--
-- Correctif : insérer NULL au lieu de '' quand le téléphone est absent
-- (UNIQUE autorise plusieurs NULL), et normaliser les lignes existantes.
-- (Déjà appliqué en prod le 2026-06-01 ; consigné ici pour les rebuilds.)
-- =============================================================================

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
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'TENANT');
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  -- NULLIF : un téléphone absent/vide devient NULL (et non '') pour ne pas
  -- heurter la contrainte UNIQUE users_phone_key.
  user_phone := NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''), '');

  IF user_role NOT IN ('OWNER', 'TENANT', 'STUDENT', 'AGENCY', 'ADMIN') THEN
    user_role := 'TENANT';
  END IF;

  INSERT INTO public.users (
    id, email, first_name, last_name, phone, role, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, user_first_name, user_last_name, user_phone,
    user_role::user_role, NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Normalise les téléphones vides existants en NULL (idempotent).
UPDATE public.users SET phone = NULL WHERE phone = '';
