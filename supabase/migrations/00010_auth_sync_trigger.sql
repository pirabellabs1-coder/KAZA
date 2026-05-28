-- =============================================================================
-- KAZA — Trigger sync auth.users → public.users
-- À chaque inscription Supabase, on crée la ligne miroir dans public.users
-- avec le rôle stocké dans raw_user_meta_data.role (fourni au signup).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_phone TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'TENANT');
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');

  -- Validation rôle : on autorise OWNER, TENANT, STUDENT, AGENCY, ADMIN
  IF user_role NOT IN ('OWNER', 'TENANT', 'STUDENT', 'AGENCY', 'ADMIN') THEN
    user_role := 'TENANT';
  END IF;

  INSERT INTO public.users (
    id, email, first_name, last_name, phone, role, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_first_name,
    user_last_name,
    user_phone,
    user_role::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
