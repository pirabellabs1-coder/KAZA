-- =============================================================================
-- Kaabo — Commission plateforme sur les VENTES de biens (3 % par défaut)
--
-- Prélevée au versement de l'acompte de réservation (qui transite par Kaabo).
-- Le taux est piloté par platform_settings.payments.saleCommission. On trace
-- le montant de commission retenu sur l'offre correspondante.
-- =============================================================================

ALTER TABLE public.property_offers
  ADD COLUMN IF NOT EXISTS commission_fcfa NUMERIC(14, 2) NOT NULL DEFAULT 0;

UPDATE public.platform_settings
SET value = jsonb_set(value, '{saleCommission}', '3'::jsonb)
WHERE key = 'payments';
