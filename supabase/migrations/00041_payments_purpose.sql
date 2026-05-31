-- =============================================================================
-- KAZA — Paiements multi-usage (loyer / abonnement / boost) par Mobile Money
--
-- Jusqu'ici `payments.rental_id` était NOT NULL : seuls les loyers pouvaient
-- passer par le tunnel FedaPay/Kkiapay. On rend `rental_id` nullable et on
-- ajoute `purpose` + `subscription_plan` pour permettre de PAYER un abonnement
-- (ou un boost) directement par moyen de paiement, sans dépendre du solde wallet.
-- =============================================================================

ALTER TABLE public.payments ALTER COLUMN rental_id DROP NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'RENT';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT;

-- Contrainte de cohérence : un paiement de loyer doit avoir un rental_id.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_rent_requires_rental;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_rent_requires_rental
  CHECK (purpose <> 'RENT' OR rental_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_payments_purpose ON public.payments(purpose);
