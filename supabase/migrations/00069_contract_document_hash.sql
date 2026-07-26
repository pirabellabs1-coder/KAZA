-- =============================================================================
-- Kaabo — Scellement cryptographique du TEXTE du contrat (audit contrats R3)
-- -----------------------------------------------------------------------------
-- Problème : la signature ne hachait que le PNG du trait de signature, jamais le
-- CONTENU du bail. Rien ne liait donc la signature au texte signé (valeur
-- probante faible, en contradiction avec la clause « scellé par SHA-256 »).
--
-- Correctif : on stocke le condensat SHA-256 du document généré.
--   - document_hash        : hash du document au moment de sa génération/figeage.
--   - signed_document_hash : snapshot du hash au moment de la signature complète
--                            (les deux parties) — c'est LUI qui fait foi.
-- Le code applicatif écrit ces colonnes en best-effort ; cette migration les crée.
-- =============================================================================

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS document_hash TEXT;
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS signed_document_hash TEXT;
