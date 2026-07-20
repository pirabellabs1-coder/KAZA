-- =============================================================================
-- Kaabo — Commission plateforme sur les loyers (2 % par défaut)
--
-- La commission est prélevée au moment de la libération de l'escrow : le
-- propriétaire reçoit le loyer net (montant - commission), la plateforme
-- conserve la commission. On trace le montant retenu sur la ligne escrow.
-- Le taux est piloté par platform_settings.payments.commission.
-- =============================================================================

ALTER TABLE public.escrow_payments
  ADD COLUMN IF NOT EXISTS commission_fcfa NUMERIC(14, 2) NOT NULL DEFAULT 0;

UPDATE public.platform_settings
SET value = jsonb_set(value, '{commission}', '2'::jsonb)
WHERE key = 'payments';
