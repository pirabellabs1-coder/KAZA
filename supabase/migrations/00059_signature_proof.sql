-- =============================================================================
-- Kaabo — Renforcement de la valeur probante des signatures électroniques
-- (conformément à la loi béninoise sur le numérique / signature électronique)
--
-- On conserve un "faisceau de preuves" pour chaque signature : consentement
-- explicite ("Lu et approuvé, bon pour bail"), adresse IP et appareil du
-- signataire, en plus du hash SHA-256 et de l'horodatage déjà stockés.
-- =============================================================================

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS tenant_signature_ip TEXT,
  ADD COLUMN IF NOT EXISTS owner_signature_ip  TEXT,
  ADD COLUMN IF NOT EXISTS tenant_signature_ua TEXT,
  ADD COLUMN IF NOT EXISTS owner_signature_ua  TEXT,
  ADD COLUMN IF NOT EXISTS tenant_consent      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS owner_consent       BOOLEAN NOT NULL DEFAULT FALSE;
