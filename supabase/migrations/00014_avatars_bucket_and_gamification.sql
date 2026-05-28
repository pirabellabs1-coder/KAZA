-- =============================================================================
-- KAZA — Avatars bucket + gamification (kaza_points, referrals)
-- =============================================================================

-- 1. Bucket avatars (public read, owner-only write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', TRUE, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

-- =============================================================================
-- 2. KAZA Points — solde + transactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.kaza_points_balance (
  user_id     UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance     INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE points_transaction_type AS ENUM (
  'SIGNUP_BONUS', 'REFERRAL', 'PROPERTY_LISTED', 'CONTRACT_SIGNED',
  'REVIEW_GIVEN', 'PROFILE_COMPLETED', 'KYC_APPROVED',
  'REDEEMED', 'ADMIN_ADJUSTMENT'
);

CREATE TABLE IF NOT EXISTS public.kaza_points_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        points_transaction_type NOT NULL,
  amount      INTEGER NOT NULL,
  description TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_tx_user_id ON public.kaza_points_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_points_tx_created_at ON public.kaza_points_transactions (created_at DESC);

-- Trigger qui met à jour balance après chaque transaction
CREATE OR REPLACE FUNCTION public.update_kaza_points_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.kaza_points_balance (user_id, balance, updated_at)
  VALUES (NEW.user_id, NEW.amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = kaza_points_balance.balance + NEW.amount,
        updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_points_tx_insert ON public.kaza_points_transactions;
CREATE TRIGGER on_points_tx_insert
  AFTER INSERT ON public.kaza_points_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_kaza_points_balance();

-- Donne 100 points de bienvenue à chaque nouvel utilisateur
CREATE OR REPLACE FUNCTION public.award_signup_bonus()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.kaza_points_transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'SIGNUP_BONUS', 100, 'Bonus de bienvenue')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_award_bonus ON public.users;
CREATE TRIGGER on_user_created_award_bonus
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.award_signup_bonus();

-- =============================================================================
-- 3. Referrals — codes de parrainage et conversions
-- =============================================================================

CREATE TYPE referral_status AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS public.referral_codes (
  user_id    UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  code       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  status        referral_status NOT NULL DEFAULT 'PENDING',
  points_awarded INTEGER DEFAULT 0,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals (referrer_id);

-- RLS — user voit ses propres data
ALTER TABLE public.kaza_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaza_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "balance_owner_select" ON public.kaza_points_balance;
CREATE POLICY "balance_owner_select" ON public.kaza_points_balance FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "tx_owner_select" ON public.kaza_points_transactions;
CREATE POLICY "tx_owner_select" ON public.kaza_points_transactions FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

DROP POLICY IF EXISTS "refcode_owner_all" ON public.referral_codes;
CREATE POLICY "refcode_owner_all" ON public.referral_codes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "refcode_public_read" ON public.referral_codes;
CREATE POLICY "refcode_public_read" ON public.referral_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "referrals_party_select" ON public.referrals;
CREATE POLICY "referrals_party_select" ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
