-- =============================================================================
-- KAZA — Colocation étudiante : colocataire principal + paiement par tranches.
--
-- 1) roommate_members.is_lead : désigne le colocataire PRINCIPAL d'un groupe
--    (titulaire/responsable du bail). Un seul principal par groupe.
-- 2) expense_shares.paid_fcfa : montant déjà réglé sur une part, pour permettre
--    de payer son loyer / sa part « doucement » (en plusieurs fois).
-- =============================================================================

ALTER TABLE public.roommate_members
  ADD COLUMN IF NOT EXISTS is_lead BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.expense_shares
  ADD COLUMN IF NOT EXISTS paid_fcfa NUMERIC(14, 2) NOT NULL DEFAULT 0;

-- Backfill : désigne comme principal le 1er membre ACCEPTED de chaque groupe
-- qui n'a pas encore de principal (plus ancienne adhésion).
UPDATE public.roommate_members m
SET is_lead = true
WHERE m.status = 'ACCEPTED'
  AND NOT EXISTS (
    SELECT 1 FROM public.roommate_members lead
    WHERE lead.group_id = m.group_id AND lead.is_lead = true
  )
  AND m.joined_at = (
    SELECT MIN(m2.joined_at)
    FROM public.roommate_members m2
    WHERE m2.group_id = m.group_id AND m2.status = 'ACCEPTED'
  );
