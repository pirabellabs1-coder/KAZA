-- =============================================================================
-- KAZA — Débit wallet atomique (payer depuis le solde KAZA, sans erreur)
--
-- Permet de payer loyer / frais partagés / abonnement / boost depuis le solde
-- KAZA. Le débit est ATOMIQUE (verrou FOR UPDATE sur user_wallets) → pas de
-- double-débit en cas de requêtes concurrentes. Un garde-fou empêche en plus
-- tout solde négatif au niveau du trigger (filet de sécurité ultime).
-- =============================================================================

-- 1) Garde-fou : aucun solde ne peut devenir négatif (filet de sécurité).
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  INSERT INTO public.user_wallets (user_id, balance_fcfa, total_in_fcfa, total_out_fcfa)
  VALUES (
    NEW.user_id,
    NEW.amount_fcfa,
    CASE WHEN NEW.amount_fcfa > 0 THEN NEW.amount_fcfa ELSE 0 END,
    CASE WHEN NEW.amount_fcfa < 0 THEN -NEW.amount_fcfa ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance_fcfa = user_wallets.balance_fcfa + NEW.amount_fcfa,
    total_in_fcfa = user_wallets.total_in_fcfa + CASE WHEN NEW.amount_fcfa > 0 THEN NEW.amount_fcfa ELSE 0 END,
    total_out_fcfa = user_wallets.total_out_fcfa + CASE WHEN NEW.amount_fcfa < 0 THEN -NEW.amount_fcfa ELSE 0 END,
    updated_at = NOW()
  RETURNING balance_fcfa INTO v_balance;

  IF v_balance < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Débit atomique : verrouille le wallet, vérifie gel + solde, insère le débit.
CREATE OR REPLACE FUNCTION public.wallet_debit(
  p_user        UUID,
  p_amount      NUMERIC,
  p_type        wallet_tx_type,
  p_description TEXT,
  p_reference   UUID,
  p_metadata    JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_balance NUMERIC;
  v_frozen  BOOLEAN;
  v_tx      UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- Verrou pessimiste : sérialise les débits concurrents du même wallet.
  SELECT balance_fcfa, is_frozen INTO v_balance, v_frozen
  FROM public.user_wallets
  WHERE user_id = p_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;
  IF v_frozen THEN
    RAISE EXCEPTION 'WALLET_FROZEN';
  END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  INSERT INTO public.wallet_transactions
    (user_id, type, amount_fcfa, description, reference_id, metadata)
  VALUES
    (p_user, p_type, -p_amount, p_description, p_reference, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_tx;

  RETURN v_tx;
END;
$$;

REVOKE ALL ON FUNCTION public.wallet_debit(UUID, NUMERIC, wallet_tx_type, TEXT, UUID, JSONB) FROM PUBLIC;
