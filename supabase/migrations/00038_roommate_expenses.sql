-- =============================================================================
-- KAZA — Frais partagés étudiants (colocation)
--
-- roommate_expenses : une dépense d'un groupe de colocation, payée par un
--   membre, répartie entre les membres (parts égales par défaut).
-- expense_shares    : la part de chaque membre pour une dépense + son règlement.
--
-- RLS : seuls les membres ACCEPTED du groupe voient/gèrent les dépenses.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.roommate_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.roommate_groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'OTHER'
    CHECK (category IN ('RENT', 'UTILITIES', 'GROCERIES', 'INTERNET', 'CLEANING', 'FURNITURE', 'OTHER')),
  amount_fcfa NUMERIC NOT NULL CHECK (amount_fcfa >= 0),
  expense_date DATE NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roommate_expenses_group ON public.roommate_expenses(group_id);

CREATE TABLE IF NOT EXISTS public.expense_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.roommate_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  share_fcfa NUMERIC NOT NULL CHECK (share_fcfa >= 0),
  settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expense_shares_expense ON public.expense_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_user ON public.expense_shares(user_id);

ALTER TABLE public.roommate_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;

-- Membres ACCEPTED du groupe : accès complet aux dépenses du groupe.
DROP POLICY IF EXISTS expenses_group_members ON public.roommate_expenses;
CREATE POLICY expenses_group_members ON public.roommate_expenses
  FOR ALL
  USING (
    group_id IN (
      SELECT group_id FROM public.roommate_members
      WHERE user_id = auth.uid() AND status = 'ACCEPTED'
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.roommate_members
      WHERE user_id = auth.uid() AND status = 'ACCEPTED'
    )
  );

-- Parts : visibles/gérables par les membres du groupe de la dépense liée.
DROP POLICY IF EXISTS shares_group_members ON public.expense_shares;
CREATE POLICY shares_group_members ON public.expense_shares
  FOR ALL
  USING (
    expense_id IN (
      SELECT e.id FROM public.roommate_expenses e
      WHERE e.group_id IN (
        SELECT group_id FROM public.roommate_members
        WHERE user_id = auth.uid() AND status = 'ACCEPTED'
      )
    )
  )
  WITH CHECK (
    expense_id IN (
      SELECT e.id FROM public.roommate_expenses e
      WHERE e.group_id IN (
        SELECT group_id FROM public.roommate_members
        WHERE user_id = auth.uid() AND status = 'ACCEPTED'
      )
    )
  );
