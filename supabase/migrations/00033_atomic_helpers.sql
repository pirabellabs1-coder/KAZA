-- =============================================================================
-- KAZA — Helpers atomiques (anti race-condition sur l'argent / quotas)
-- =============================================================================

-- Incrément atomique du compteur d'utilisation d'un code promo.
-- Remplace le pattern read-then-write de redeemPromo (race possible).
CREATE OR REPLACE FUNCTION public.increment_promo_used_count(p_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promo_codes
     SET used_count = used_count + 1
   WHERE id = p_id
  RETURNING used_count;
$$;

COMMENT ON FUNCTION public.increment_promo_used_count IS
  'Incrémente atomiquement promo_codes.used_count et renvoie la nouvelle valeur.';
