-- =============================================================================
-- KAZA — Métadonnées de paiement (contexte boost & divers)
--
-- Permet de payer un BOOST d'annonce par moyen de paiement (Mobile Money) :
-- le contexte (bien, durée, plan) est stocké dans `metadata` puis lu par le
-- webhook pour activer le boost après confirmation du paiement.
-- =============================================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS metadata JSONB;
