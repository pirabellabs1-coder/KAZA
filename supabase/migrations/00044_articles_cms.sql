-- =============================================================================
-- KAZA — CMS Articles (blog) : rédaction enrichie + contributeurs
--
-- - `users.is_contributor` : capacité accordée par un admin de rédiger des
--   articles (en plus des admins qui peuvent toujours rédiger).
-- - `articles` : contenu HTML enrichi, brouillon/publié, auteur, couverture.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_contributor BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  content         TEXT NOT NULL DEFAULT '',         -- HTML enrichi (Tiptap)
  cover_image_url TEXT,
  category        TEXT,
  status          TEXT NOT NULL DEFAULT 'DRAFT',     -- DRAFT | PUBLISHED
  author_id       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  read_minutes    INT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT articles_status_check CHECK (status IN ('DRAFT','PUBLISHED'))
);

CREATE INDEX IF NOT EXISTS idx_articles_status_pub
  ON public.articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles (slug);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Lecture publique : uniquement les articles publiés.
DROP POLICY IF EXISTS "articles_public_select" ON public.articles;
CREATE POLICY "articles_public_select" ON public.articles FOR SELECT
  USING (status = 'PUBLISHED');

-- Lecture auteur/admin : ses propres brouillons + tout pour l'admin.
DROP POLICY IF EXISTS "articles_author_select" ON public.articles;
CREATE POLICY "articles_author_select" ON public.articles FOR SELECT
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Écriture : admins et contributeurs.
DROP POLICY IF EXISTS "articles_insert" ON public.articles;
CREATE POLICY "articles_insert" ON public.articles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()
            AND (u.role = 'ADMIN' OR u.is_contributor = true))
  );

DROP POLICY IF EXISTS "articles_update" ON public.articles;
CREATE POLICY "articles_update" ON public.articles FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

DROP POLICY IF EXISTS "articles_delete" ON public.articles;
CREATE POLICY "articles_delete" ON public.articles FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );
