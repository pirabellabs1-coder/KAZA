-- =============================================================================
-- KAZA — Articles : signature d'auteur affichée (byline) découplée du compte.
--
-- `author_id` reste le compte propriétaire (permissions RLS) ; `author_name`
-- et `author_role` permettent d'afficher une signature personnalisée (utile
-- pour les articles éditoriaux historiques et les personas de la rédaction).
-- =============================================================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS author_role TEXT;
