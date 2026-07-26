-- =============================================================================
-- Kaabo — Séquestre de la caution (dépôt de garantie) locative
-- -----------------------------------------------------------------------------
-- Objectif : encaisser la caution en même temps que le 1er loyer, la CONSERVER
-- en séquestre (distincte du loyer), puis la RESTITUER au locataire en fin de
-- bail (au lieu de la reverser au propriétaire comme le loyer).
--
-- `deposit_fcfa` sur `escrow_payments` mémorise la part « caution » du montant
-- encaissé. À la libération, le propriétaire reçoit le loyer NET (montant −
-- caution − commission) ; la caution reste retenue et est remboursée au wallet
-- du locataire à la clôture du bail.
--
-- Le code applicatif lit/écrit cette colonne en best-effort : cette migration la
-- crée. Une fois appliquée, l'encaissement + restitution de la caution peuvent
-- être activés côté serveur.
-- =============================================================================

ALTER TABLE public.escrow_payments
  ADD COLUMN IF NOT EXISTS deposit_fcfa NUMERIC(14, 2) NOT NULL DEFAULT 0;
