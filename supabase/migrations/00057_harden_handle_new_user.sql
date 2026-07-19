-- =============================================================================
-- 00057 — Durcissement de handle_new_user (inscription robuste)
-- =============================================================================
-- Corrige « Database error creating new user » lors de l'inscription :
--   1) le rôle BUYER n'était pas dans la liste autorisée -> silencieusement
--      converti en TENANT. BUYER est maintenant accepté.
--   2) la contrainte UNIQUE(phone) faisait échouer l'inscription si le numéro
--      était déjà utilisé (le trigger ne gérait que ON CONFLICT (id)).
--      -> si le téléphone est déjà pris, on l'ignore (NULL) au lieu de crasher.
--   3) filet de sécurité : toute unique_violation résiduelle n'annule plus la
--      création du compte auth (on log un WARNING et on continue).
-- =============================================================================

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

  -- BUYER ajoute a la liste des roles valides.
  IF user_role NOT IN ('OWNER','TENANT','STUDENT','AGENCY','ADMIN','BUYER') THEN
    user_role := 'TENANT';
  END IF;

  -- Telephone deja utilise par un autre compte -> on ne le reprend pas
  -- (evite le crash sur la contrainte UNIQUE(phone)).
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
  -- Ne jamais bloquer la creation du compte auth pour un conflit residuel.
  RAISE WARNING 'handle_new_user: conflit unique ignore pour %', NEW.email;
  RETURN NEW;
END;
$fn$;
