-- =============================================================================
-- KAZA - Triggers de notification automatique
--
-- Crée des notifications dans `public.notifications` quand des événements
-- métier surviennent, sans avoir à coder la création dans chaque server action.
--
-- 1. Demande de visite → notifie le propriétaire
-- 2. Visite acceptée  → notifie le locataire
-- 3. Visite refusée   → notifie le locataire
-- =============================================================================

-- ------------------------------------------------------------
-- 1. Demande de visite → notif propriétaire
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_owner_on_visit_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id     UUID;
  v_property_title TEXT;
  v_tenant_name  TEXT;
BEGIN
  SELECT p.owner_id, p.title
    INTO v_owner_id, v_property_title
    FROM public.properties p
   WHERE p.id = NEW.property_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(u.first_name || ' ' || u.last_name, 'Un locataire')
    INTO v_tenant_name
    FROM public.users u
   WHERE u.id = NEW.tenant_id;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    v_owner_id,
    'visit_request',
    'Nouvelle demande de visite',
    v_tenant_name || ' souhaite visiter « ' || COALESCE(v_property_title, 'votre annonce') || ' » le ' || to_char(NEW.requested_date, 'DD/MM/YYYY') || '.',
    '/owner/visits',
    jsonb_build_object(
      'visit_id', NEW.id,
      'property_id', NEW.property_id,
      'tenant_id', NEW.tenant_id,
      'requested_date', NEW.requested_date,
      'requested_time', NEW.requested_time
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_visit_request_created ON public.visit_requests;
CREATE TRIGGER on_visit_request_created
  AFTER INSERT ON public.visit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_on_visit_request();


-- ------------------------------------------------------------
-- 2. Changement de statut visite → notif locataire
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_tenant_on_visit_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_title TEXT;
  v_notif_type     notification_type;
  v_title          TEXT;
  v_body           TEXT;
BEGIN
  -- Seuls les changements de statut nous intéressent
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT p.title INTO v_property_title
    FROM public.properties p
   WHERE p.id = NEW.property_id;

  IF NEW.status = 'CONFIRMED' THEN
    v_notif_type := 'visit_accepted';
    v_title := 'Visite confirmée';
    v_body := 'Votre visite de « ' || COALESCE(v_property_title, 'l''annonce') || ' » a été confirmée pour le ' || to_char(NEW.requested_date, 'DD/MM/YYYY') || '.';
  ELSIF NEW.status = 'CANCELLED' THEN
    v_notif_type := 'visit_rejected';
    v_title := 'Visite annulée';
    v_body := 'Votre demande de visite pour « ' || COALESCE(v_property_title, 'l''annonce') || ' » a été annulée.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (
    NEW.tenant_id,
    v_notif_type,
    v_title,
    v_body,
    '/tenant/rentals',
    jsonb_build_object(
      'visit_id', NEW.id,
      'property_id', NEW.property_id,
      'new_status', NEW.status
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_visit_request_status_changed ON public.visit_requests;
CREATE TRIGGER on_visit_request_status_changed
  AFTER UPDATE OF status ON public.visit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tenant_on_visit_status();
