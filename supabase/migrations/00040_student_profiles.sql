-- =============================================================================
-- KAZA — Profils colocataires étudiants (persistance + matching)
--
-- student_profiles : le profil de colocation d'un étudiant (préférences,
-- budget, mode de vie…) stocké en JSONB pour coller au formulaire sans
-- friction. Lecture publique (pour le matching entre étudiants), écriture
-- réservée au propriétaire du profil.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  university TEXT,
  budget_max INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_university ON public.student_profiles(university);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Propriétaire : CRUD complet sur son profil.
DROP POLICY IF EXISTS student_profiles_own ON public.student_profiles;
CREATE POLICY student_profiles_own ON public.student_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Lecture publique des profils visibles (matching).
DROP POLICY IF EXISTS student_profiles_public_read ON public.student_profiles;
CREATE POLICY student_profiles_public_read ON public.student_profiles
  FOR SELECT
  USING (is_public = true);
