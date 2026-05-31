-- =============================================================================
-- KAZA — Valeurs d'enum wallet_tx_type manquantes
--
-- BOOST_DEBIT : débit du wallet lors de l'activation d'un boost d'annonce
--               (le code l'insérait déjà mais la valeur n'existait pas → erreur).
-- TOPUP       : crédit du wallet lors d'une recharge par Mobile Money.
-- =============================================================================

ALTER TYPE wallet_tx_type ADD VALUE IF NOT EXISTS 'BOOST_DEBIT';
ALTER TYPE wallet_tx_type ADD VALUE IF NOT EXISTS 'TOPUP';
