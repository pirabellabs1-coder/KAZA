-- =============================================================================
-- KAZA — Champs du contrat de bail (auto-remplissage juridique).
--
-- Le contrat de bail d'habitation (Loi 2018-12 Bénin / OHADA) référence
-- l'identité des parties (CNI/profession/employeur/adresse) et les charges.
-- On ajoute les colonnes nécessaires pour remplir le bail au lieu d'afficher
-- « à compléter ». Identité = profil de chaque partie ; charges = bail.
-- (Déjà appliqué en prod le 2026-06-01 ; consigné ici pour les rebuilds.)
-- =============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_number TEXT;   -- CNI / pièce
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employer TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS monthly_charges NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.rentals
  ADD COLUMN IF NOT EXISTS additional_charges_description TEXT;
