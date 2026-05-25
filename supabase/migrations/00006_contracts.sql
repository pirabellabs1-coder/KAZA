-- ============================================================
-- KAZA - Contrats (génération PDF + signature électronique)
-- Wave 2 - Kwame Asante
-- ============================================================
-- La table `contracts` existe déjà dans 00001_initial_schema.sql.
-- Cette migration :
--   1) Ajoute le type ENUM `contract_status` (cycle de signature)
--   2) Ajoute les colonnes de hash de signatures SHA-256
--      (jamais le PNG en clair) + horodatages
--   3) Ajoute la colonne `status` + alias `pdf_url`
--   4) Met à jour les politiques RLS (les parties peuvent lire et
--      signer leur propre contrat)
--   5) Crée le bucket Storage privé `contracts`
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUM - contract_status
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM (
      'DRAFT',            -- Brouillon, PDF en cours de génération
      'PENDING_TENANT',   -- En attente de la signature du locataire
      'PENDING_OWNER',    -- En attente de la signature du propriétaire
      'SIGNED',           -- Les deux parties ont signé
      'CANCELLED'         -- Contrat annulé avant signature complète
    );
  END IF;
END$$;

-- ------------------------------------------------------------
-- 2. TABLE - contracts (création conditionnelle au cas où elle
--    n'existerait pas - normalement déjà créée par 00001).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id           UUID REFERENCES public.rentals(id) ON DELETE SET NULL,
  roommate_group_id   UUID REFERENCES public.roommate_groups(id) ON DELETE SET NULL,
  contract_type       contract_type NOT NULL DEFAULT 'RENTAL',
  contract_pdf_url    TEXT,
  signed_by_owner     BOOLEAN NOT NULL DEFAULT FALSE,
  signed_by_tenant    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at           TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 3. Colonnes additionnelles (signatures + statut)
-- ------------------------------------------------------------
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS status                contract_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS pdf_url               TEXT,
  ADD COLUMN IF NOT EXISTS tenant_signature_hash TEXT,
  ADD COLUMN IF NOT EXISTS tenant_signed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_signature_hash  TEXT,
  ADD COLUMN IF NOT EXISTS owner_signed_at       TIMESTAMPTZ;

-- Indexes utiles pour le dashboard "Mes contrats"
CREATE INDEX IF NOT EXISTS idx_contracts_rental_id
  ON public.contracts (rental_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status
  ON public.contracts (status);

-- ------------------------------------------------------------
-- 4. RLS - lecture et update signature par les parties
-- ------------------------------------------------------------
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Lecture : tenant ou owner du rental associé
DROP POLICY IF EXISTS "contracts_select_parties_v2" ON public.contracts;
CREATE POLICY "contracts_select_parties_v2"
  ON public.contracts FOR SELECT
  USING (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = contracts.rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );

-- Update : limité aux colonnes de signature (Postgres ne supporte
-- pas le filtrage par colonne au niveau policy, on s'appuie donc
-- sur le contrôle applicatif dans les Server Actions).
DROP POLICY IF EXISTS "contracts_update_sign_v2" ON public.contracts;
CREATE POLICY "contracts_update_sign_v2"
  ON public.contracts FOR UPDATE
  USING (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = contracts.rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = contracts.rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- 5. STORAGE - bucket privé `contracts`
-- ------------------------------------------------------------
-- Les PDF signés ne doivent jamais être publics (données légales).
-- L'accès se fait via signed URL (60s) générée côté serveur.
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Lecture du PDF : tenant ou owner du rental (chemin attendu :
-- `{contract_id}.pdf` ou `{contract_id}/contract.pdf`).
DROP POLICY IF EXISTS "contracts_storage_read_parties" ON storage.objects;
CREATE POLICY "contracts_storage_read_parties"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.rentals r ON r.id = c.rental_id
      JOIN public.properties p ON p.id = r.property_id
      WHERE (storage.objects.name LIKE c.id::text || '%')
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );
