-- =============================================================================
-- KAZA — Achievements (badges gamification) + Surveys (sondages NPS)
--
-- Catalogue immuable de badges (achievement_definitions) + unlocks par user
-- (user_achievements). Les sondages ont un schema JSONB de questions et
-- les reponses sont stockees dans survey_responses (1 par user/sondage).
--
-- Toutes les tables sont protegees par RLS : un user voit ses propres
-- donnees, un admin voit tout.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Achievements — catalogue
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT,
  category      TEXT,
  points_reward INTEGER DEFAULT 0,
  rarity        TEXT DEFAULT 'common',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catalogue lisible publiquement (pas de RLS critique).
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievement_definitions_public_read" ON public.achievement_definitions;
CREATE POLICY "achievement_definitions_public_read"
  ON public.achievement_definitions FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- 2. User achievements (unlocked)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  progress       INTEGER DEFAULT 0,
  target         INTEGER DEFAULT 1,
  unlocked_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
  ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked
  ON public.user_achievements (user_id, unlocked_at);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_self" ON public.user_achievements;
CREATE POLICY "user_achievements_self"
  ON public.user_achievements FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ---------------------------------------------------------------------------
-- 3. Surveys
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.surveys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  questions     JSONB NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT true,
  reward_points INTEGER DEFAULT 50,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id  UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answers    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(survey_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id
  ON public.survey_responses (user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id
  ON public.survey_responses (survey_id);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surveys_public_read" ON public.surveys;
CREATE POLICY "surveys_public_read"
  ON public.surveys FOR SELECT
  USING (
    active = true
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "survey_responses_self" ON public.survey_responses;
CREATE POLICY "survey_responses_self"
  ON public.survey_responses FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Seed catalogue d'achievements
-- ---------------------------------------------------------------------------

INSERT INTO public.achievement_definitions
  (code, title, description, icon, category, points_reward, rarity)
VALUES
  ('first_login',      'Premier pas',              'Connexion initiale à KAZA',                          'sparkles',     'onboarding',  50,   'common'),
  ('profile_complete', 'Profil complet',           'Toutes les infos profil renseignées',                'user-check',   'onboarding',  100,  'common'),
  ('kyc_verified',     'Identité vérifiée',        'KYC approuvé',                                       'shield-check', 'trust',       500,  'rare'),
  ('first_property',   'Premier bien publié',      'Première annonce créée',                             'home',         'owner',       200,  'common'),
  ('first_visit',      'Première visite',          'Première demande de visite envoyée',                 'calendar',     'tenant',      50,   'common'),
  ('first_review',     'Premier avis',             'Première note laissée à un bien',                    'star',         'tenant',      100,  'common'),
  ('referral_master',  'Maître parrain',           '5 filleuls actifs',                                  'users',        'social',      1000, 'epic'),
  ('top_owner',        'Propriétaire d''excellence', '10+ biens publiés avec note > 4.5',                'crown',        'owner',       2000, 'legendary')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Seed sondage NPS de bienvenue
-- ---------------------------------------------------------------------------

INSERT INTO public.surveys (title, description, reward_points, questions, active)
SELECT
  'Votre expérience KAZA',
  'Aidez-nous à améliorer la plateforme — 5 minutes max',
  100,
  '[
    {"id":"satisfaction","type":"scale","question":"Sur une échelle de 1 à 10, comment évaluez-vous votre expérience globale ?","min":1,"max":10},
    {"id":"ease","type":"choice","question":"L''utilisation est-elle facile ?","options":["Très facile","Facile","Difficile","Très difficile"]},
    {"id":"recommend","type":"choice","question":"Recommanderiez-vous KAZA à un proche ?","options":["Oui, certainement","Peut-être","Non"]},
    {"id":"missing","type":"text","question":"Quelle fonctionnalité aimeriez-vous voir ajoutée ?"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.surveys WHERE title = 'Votre expérience KAZA'
);
