-- =============================================================================
-- KAZA — Valeurs d'enum wallet_tx_type pour les débits loyer / frais partagés.
-- (Déjà appliquées en prod ; consignées ici pour les rebuilds. Idempotent.)
-- =============================================================================

ALTER TYPE wallet_tx_type ADD VALUE IF NOT EXISTS 'RENT_DEBIT';
ALTER TYPE wallet_tx_type ADD VALUE IF NOT EXISTS 'EXPENSE_DEBIT';
