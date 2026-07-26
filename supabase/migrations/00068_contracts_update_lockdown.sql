-- =============================================================================
-- Kaabo — Durcissement RLS : verrouillage de l'UPDATE direct sur `contracts`
-- -----------------------------------------------------------------------------
-- Problème (audit contrats R8) : les policies `contracts_update_sign` /
-- `contracts_update_sign_v2` autorisaient le locataire OU le propriétaire à
-- faire un UPDATE sur N'IMPORTE QUELLE colonne de leur contrat via PostgREST
-- (Postgres ne filtre pas par colonne). Un signataire malveillant pouvait donc
-- écrire directement `status='SIGNED'`, poser le hash de l'autre partie, ou
-- modifier les montants — en contournant l'ordre de signature applicatif.
--
-- Correctif : toutes les écritures légitimes sur `contracts` passent désormais
-- par le client ADMIN (service_role, qui bypass la RLS) — signature, envoi au
-- locataire, génération du document, annulation. Aucun utilisateur n'a besoin
-- d'un UPDATE direct. On supprime donc les policies d'UPDATE : plus aucun
-- UPDATE possible via la clé anon/authenticated. La LECTURE (policies SELECT
-- des parties) reste inchangée.
-- =============================================================================

DROP POLICY IF EXISTS "contracts_update_sign" ON public.contracts;
DROP POLICY IF EXISTS "contracts_update_sign_v2" ON public.contracts;

-- Aucune policy d'UPDATE recréée : seul le service_role (actions serveur
-- validées) peut modifier un contrat.
