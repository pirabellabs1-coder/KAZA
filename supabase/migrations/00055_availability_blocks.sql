-- =============================================================================
-- KAZA — Blocages de disponibilité d'un bien (propriétaire)
--
-- Le propriétaire d'un bien peut bloquer des dates où le bien n'est pas
-- disponible (maintenance, usage personnel, réservé hors-plateforme, autre).
-- Ces blocages alimentent le calendrier de disponibilité côté propriétaire et
-- empêchent les demandes de visite sur les périodes concernées.
--
-- Additif et non-breaking.
-- =============================================================================

-- 1) Table -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'other'
    CHECK (reason IN ('maintenance', 'personal_use', 'reserved', 'other')),
  note TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_property
  ON public.availability_blocks(property_id);

-- 2) RLS ---------------------------------------------------------------------
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

-- Propriétaire du bien (et ADMIN) : SELECT de ses blocages.
DROP POLICY IF EXISTS availability_blocks_owner_select ON public.availability_blocks;
CREATE POLICY availability_blocks_owner_select ON public.availability_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Propriétaire du bien (et ADMIN) : INSERT d'un blocage sur son bien.
DROP POLICY IF EXISTS availability_blocks_owner_insert ON public.availability_blocks;
CREATE POLICY availability_blocks_owner_insert ON public.availability_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Propriétaire du bien (et ADMIN) : UPDATE de ses blocages.
DROP POLICY IF EXISTS availability_blocks_owner_update ON public.availability_blocks;
CREATE POLICY availability_blocks_owner_update ON public.availability_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Propriétaire du bien (et ADMIN) : DELETE de ses blocages.
DROP POLICY IF EXISTS availability_blocks_owner_delete ON public.availability_blocks;
CREATE POLICY availability_blocks_owner_delete ON public.availability_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
