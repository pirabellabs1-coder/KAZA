-- =============================================================================
-- Kaabo — Conversion / dépense des points Kaabo (atomique)
--
-- redeem_kaza_points : débite les points de l'utilisateur courant (auth.uid())
-- et, le cas échéant, crédite son Kaabo Wallet du montant FCFA correspondant.
-- Verrou pessimiste sur le solde de points pour éviter les doubles dépenses.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.redeem_kaza_points(
  p_cost          INTEGER,
  p_label         TEXT,
  p_wallet_credit NUMERIC DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user    UUID := auth.uid();
  v_balance INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF p_cost IS NULL OR p_cost <= 0 THEN
    RAISE EXCEPTION 'INVALID_COST';
  END IF;

  -- Verrou pessimiste sur le solde de points.
  SELECT balance INTO v_balance
  FROM public.kaza_points_balance
  WHERE user_id = v_user
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS';
  END IF;

  -- Débit des points (le trigger met à jour le solde).
  INSERT INTO public.kaza_points_transactions (user_id, type, amount, description, metadata)
  VALUES (v_user, 'REDEEMED', -p_cost, p_label,
          jsonb_build_object('reward', p_label, 'wallet_credit', p_wallet_credit));

  -- Crédit wallet éventuel (le trigger met à jour le solde du wallet).
  IF p_wallet_credit IS NOT NULL AND p_wallet_credit > 0 THEN
    INSERT INTO public.wallet_transactions (user_id, type, amount_fcfa, description, metadata)
    VALUES (v_user, 'BONUS', p_wallet_credit,
            'Conversion de points Kaabo — ' || p_label,
            jsonb_build_object('points_spent', p_cost));
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance - p_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_kaza_points(INTEGER, TEXT, NUMERIC) TO authenticated;
