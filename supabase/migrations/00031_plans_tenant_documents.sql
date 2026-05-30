-- =============================================================================
-- KAZA — Plans d'abonnement centralises en DB + documents locataire
--   1. plans            : tarifs Pro/Plus pilotables sans redeploiement
--   2. tenant_documents : pieces du dossier locatif persistees (Storage)
-- =============================================================================

-- 1. PLANS --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  key           TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  audience      TEXT NOT NULL,             -- AGENCY | TENANT
  price_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_yearly  NUMERIC(12,2),
  features      JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plans_public_select ON public.plans;
CREATE POLICY plans_public_select ON public.plans FOR SELECT USING (true);
DROP POLICY IF EXISTS plans_admin_write ON public.plans;
CREATE POLICY plans_admin_write ON public.plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

INSERT INTO public.plans (key, name, audience, price_monthly, price_yearly, features, sort_order) VALUES
  ('PRO_STARTER','KAZA Pro Starter','AGENCY',75000,NULL,
    '["50 annonces actives","5 membres","3 boosts/mois","10 GB","Support email"]'::jsonb,1),
  ('PRO_PREMIUM','KAZA Pro Premium','AGENCY',145000,NULL,
    '["200 annonces actives","15 membres","10 boosts/mois","50 GB","Support prioritaire 7j/7","Page agence custom","Analytics export"]'::jsonb,2),
  ('PRO_ELITE','KAZA Pro Elite','AGENCY',295000,NULL,
    '["Annonces illimitees","Membres illimites","Boosts illimites","200 GB","Support 24/7 dedie","API access","Badge Verifie+"]'::jsonb,3),
  ('PLUS_MONTHLY','KAZA Plus Mensuel','TENANT',4900,NULL,
    '["Alertes prioritaires","Visites express","Annonces premium en avant-premiere","Conseil personnalise"]'::jsonb,4),
  ('PLUS_YEARLY','KAZA Plus Annuel','TENANT',3900,47000,
    '["Tout Plus Mensuel","2 mois offerts","Cadeau bienvenue","Coach immobilier dedie"]'::jsonb,5)
ON CONFLICT (key) DO NOTHING;

-- 2. DOCUMENTS LOCATAIRE ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL,               -- payslip | id | address_proof | guarantor | other
  label       TEXT NOT NULL,
  file_url    TEXT,
  amount      TEXT,
  status      TEXT NOT NULL DEFAULT 'UPLOADED',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenant_documents_user_idx ON public.tenant_documents (user_id, uploaded_at DESC);
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_docs_own ON public.tenant_documents;
CREATE POLICY tenant_docs_own ON public.tenant_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
