-- =============================================================================
-- KAZA — Rôle ACHETEUR (BUYER)
--
-- Ajoute le rôle 'BUYER' à l'enum user_role pour permettre l'inscription en
-- tant qu'acheteur (achat de bien). Additif et non-breaking.
-- =============================================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'BUYER';
