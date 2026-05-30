-- =============================================================================
-- KAZA — Références de transfert escrow (payout / refund FedaPay)
-- =============================================================================
-- Permet de tracer le transfert réel déclenché lors de la libération de
-- l'escrow vers le propriétaire (payout_ref) ou du remboursement vers le
-- locataire (refund_ref). Ces colonnes stockent l'identifiant retourné par
-- FedaPay afin de pouvoir réconcilier / auditer les mouvements d'argent.
--
-- IMPORTANT : ne JAMAIS marquer un escrow comme RELEASED/REFUNDED sans avoir
-- enregistré la référence du transfert correspondant.
-- =============================================================================

ALTER TABLE public.escrow_payments
  ADD COLUMN IF NOT EXISTS payout_ref TEXT,
  ADD COLUMN IF NOT EXISTS refund_ref TEXT;

COMMENT ON COLUMN public.escrow_payments.payout_ref IS
  'Identifiant du payout FedaPay déclenché lors de la libération vers le propriétaire.';
COMMENT ON COLUMN public.escrow_payments.refund_ref IS
  'Identifiant du transfert FedaPay déclenché lors du remboursement vers le locataire.';
