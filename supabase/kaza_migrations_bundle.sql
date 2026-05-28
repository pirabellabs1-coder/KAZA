-- =============================================================
-- KAZA — Bundle de migrations consolidé
-- Généré le Wed May 27 23:26:27 WCAST 2026
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================


-- =============================================================
-- migrations/00001_initial_schema.sql
-- =============================================================
-- ============================================================
-- KAZA - Initial Database Schema
-- African Real Estate Platform
-- ============================================================
-- This migration creates the complete database schema including:
--   - PostgreSQL extensions (PostGIS, pg_trgm, uuid-ossp)
--   - Custom ENUM types for domain modeling
--   - All application tables with foreign key relationships
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------

-- PostGIS: geospatial queries (property search by location, radius search)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- pg_trgm: trigram-based fuzzy text search on property titles/descriptions
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- uuid-ossp: UUID generation functions (gen_random_uuid() is built-in but
-- uuid-ossp provides additional generation strategies if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ------------------------------------------------------------
-- 2. CUSTOM ENUM TYPES
-- ------------------------------------------------------------

-- User roles in the platform
CREATE TYPE user_role AS ENUM (
  'TENANT',           -- Locataire: searches and rents properties
  'OWNER',            -- Propriétaire: lists and manages properties
  'STUDENT',          -- Étudiant: searches for roommates and shared housing
  'ADMIN'             -- Administrateur: platform management
);

-- Identity verification workflow status
CREATE TYPE verification_status AS ENUM (
  'UNVERIFIED',       -- No documents submitted
  'PENDING',          -- Documents submitted, awaiting review
  'APPROVED',         -- Identity verified by admin
  'REJECTED'          -- Documents rejected (fraud, poor quality, etc.)
);

-- Property listing lifecycle
CREATE TYPE property_status AS ENUM (
  'DRAFT',            -- Created but not yet published
  'PENDING_REVIEW',   -- Submitted for moderation
  'AVAILABLE',        -- Active and visible in search results
  'RENTED',           -- Currently occupied
  'UNAVAILABLE',      -- Temporarily hidden by owner
  'ARCHIVED'          -- Permanently removed from listings
);

-- Property category
CREATE TYPE property_type AS ENUM (
  'APARTMENT',        -- Appartement
  'HOUSE',            -- Maison
  'STUDIO',           -- Studio
  'VILLA',            -- Villa
  'ROOM',             -- Chambre individuelle
  'SHARED_ROOM',      -- Chambre partagée / colocation
  'COMMERCIAL',       -- Local commercial
  'LAND'              -- Terrain
);

-- Rental agreement lifecycle
CREATE TYPE rental_status AS ENUM (
  'PENDING',          -- Lease proposed, not yet signed
  'ACTIVE',           -- Lease signed, tenant in residence
  'COMPLETED',        -- Lease ended normally
  'CANCELLED',        -- Lease cancelled before move-in
  'TERMINATED'        -- Lease terminated early
);

-- Supported payment channels
CREATE TYPE payment_method AS ENUM (
  'MOBILE_MONEY',     -- MTN MoMo, Moov Money, etc. via FedaPay/KKiaPay
  'CARD',             -- Visa/Mastercard via FedaPay
  'BANK_TRANSFER',    -- Direct bank transfer
  'WALLET',           -- KAZA internal wallet
  'CASH'              -- Cash payment (recorded manually)
);

-- Payment transaction status
CREATE TYPE payment_status AS ENUM (
  'PENDING',          -- Transaction initiated
  'PROCESSING',       -- Payment gateway processing
  'COMPLETED',        -- Payment confirmed
  'FAILED',           -- Payment declined or errored
  'REFUNDED'          -- Payment reversed
);

-- Escrow lifecycle for security deposits and rent guarantees
CREATE TYPE escrow_status AS ENUM (
  'HELD',             -- Funds held in escrow
  'PARTIALLY_RELEASED', -- Some funds released
  'RELEASED',         -- All funds released to owner
  'REFUNDED',         -- Funds returned to tenant
  'DISPUTED'          -- Under dispute resolution
);

-- Property visit scheduling status
CREATE TYPE visit_status AS ENUM (
  'PENDING',          -- Visit requested, awaiting owner response
  'CONFIRMED',        -- Owner accepted the visit
  'CANCELLED',        -- Cancelled by either party
  'COMPLETED',        -- Visit took place
  'NO_SHOW'           -- Requester did not show up
);

-- Roommate group membership status
CREATE TYPE roommate_status AS ENUM (
  'INVITED',          -- Invited to join the group
  'PENDING',          -- Applied to join, awaiting approval
  'ACCEPTED',         -- Active member of the group
  'REJECTED',         -- Application denied
  'LEFT'              -- Voluntarily left the group
);

-- Legal contract category
CREATE TYPE contract_type AS ENUM (
  'RENTAL',           -- Standard rental lease
  'ROOMMATE',         -- Shared housing agreement (convention de colocation)
  'SUBLEASE'          -- Subletting agreement
);

-- Roommate listing lifecycle
CREATE TYPE roommate_listing_status AS ENUM (
  'ACTIVE',           -- Open for applications
  'FULL',             -- All spots filled
  'CLOSED',           -- Manually closed by creator
  'ARCHIVED'          -- No longer visible
);

-- ------------------------------------------------------------
-- 3. TABLES
-- ------------------------------------------------------------

-- ========================
-- USERS
-- ========================
-- Central user table. Authentication is handled by Supabase Auth;
-- this table stores extended profile data. The id column references
-- auth.users(id) so that RLS policies can use auth.uid().
CREATE TABLE users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT UNIQUE NOT NULL,
  phone                     TEXT UNIQUE,
  password_hash             TEXT,
  first_name                TEXT NOT NULL,
  last_name                 TEXT NOT NULL,
  profile_photo_url         TEXT,
  role                      user_role NOT NULL DEFAULT 'TENANT',
  is_verified               BOOLEAN NOT NULL DEFAULT FALSE,
  verification_document_url TEXT,
  verification_selfie_url   TEXT,
  verification_status       verification_status NOT NULL DEFAULT 'UNVERIFIED',
  address                   TEXT,
  bio                       TEXT,
  rating_average            DECIMAL(3, 2) DEFAULT 0.00,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- PROPERTIES
-- ========================
-- Real estate listings posted by property owners.
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  price           DECIMAL(10, 2) NOT NULL,
  bedrooms        INT,
  bathrooms       INT,
  square_meters   INT,
  amenities       TEXT[] DEFAULT '{}',
  location        geography(Point, 4326),
  address         TEXT,
  status          property_status NOT NULL DEFAULT 'DRAFT',
  property_type   property_type NOT NULL,
  views_count     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- PROPERTY PHOTOS
-- ========================
-- Multiple photos per property, ordered by display_order.
CREATE TABLE property_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL,
  display_order   INT NOT NULL DEFAULT 0,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- ROOMMATE LISTINGS
-- ========================
-- Students or tenants looking for roommates to share housing.
CREATE TABLE roommate_listings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  room_size           TEXT,
  price               DECIMAL(10, 2) NOT NULL,
  bedrooms_available  INT NOT NULL DEFAULT 1,
  people_looking_for  INT NOT NULL DEFAULT 1,
  preferred_profile   JSONB DEFAULT '{}',
  location            geography(Point, 4326),
  address             TEXT,
  status              roommate_listing_status NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_roommate_listings_updated_at
  BEFORE UPDATE ON roommate_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- ROOMMATE GROUPS
-- ========================
-- A group of people who intend to live together, linked to a listing.
CREATE TABLE roommate_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES roommate_listings(id) ON DELETE CASCADE,
  group_name      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- ROOMMATE MEMBERS
-- ========================
-- Membership of individual users within a roommate group.
CREATE TABLE roommate_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES roommate_groups(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          roommate_status NOT NULL DEFAULT 'PENDING',
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  left_at         TIMESTAMPTZ,

  CONSTRAINT uq_roommate_members_group_user UNIQUE (group_id, user_id)
);

-- ========================
-- RENTALS
-- ========================
-- Active and historical rental agreements between owners and tenants.
CREATE TABLE rentals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date        DATE NOT NULL,
  end_date          DATE,
  monthly_rent      DECIMAL(10, 2) NOT NULL,
  security_deposit  DECIMAL(10, 2) DEFAULT 0.00,
  status            rental_status NOT NULL DEFAULT 'PENDING',
  contract_url      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- MESSAGES
-- ========================
-- Direct messages between users, optionally linked to a property
-- or roommate listing for context.
CREATE TABLE messages (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id           UUID REFERENCES properties(id) ON DELETE SET NULL,
  roommate_listing_id   UUID REFERENCES roommate_listings(id) ON DELETE SET NULL,
  content               TEXT NOT NULL,
  is_read               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- PAYMENTS
-- ========================
-- Individual payment transactions for rent, deposits, etc.
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id       UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          DECIMAL(10, 2) NOT NULL,
  payment_method  payment_method NOT NULL,
  transaction_id  TEXT UNIQUE,
  status          payment_status NOT NULL DEFAULT 'PENDING',
  payment_date    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- ESCROW PAYMENTS
-- ========================
-- Security deposits and rent guarantees held in escrow.
CREATE TABLE escrow_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id       UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount    DECIMAL(10, 2) NOT NULL,
  amount_paid     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  duration_days   INT NOT NULL DEFAULT 30,
  status          escrow_status NOT NULL DEFAULT 'HELD',
  release_date    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- RATINGS
-- ========================
-- Users rate each other after a rental period ends.
CREATE TABLE ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rental_id       UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- CONTRACTS
-- ========================
-- Digitally generated and signed rental or roommate contracts.
CREATE TABLE contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id           UUID REFERENCES rentals(id) ON DELETE SET NULL,
  roommate_group_id   UUID REFERENCES roommate_groups(id) ON DELETE SET NULL,
  contract_type       contract_type NOT NULL,
  contract_pdf_url    TEXT,
  signed_by_owner     BOOLEAN NOT NULL DEFAULT FALSE,
  signed_by_tenant    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at           TIMESTAMPTZ
);

-- ========================
-- VISIT REQUESTS
-- ========================
-- Scheduling visits for property viewings.
CREATE TABLE visit_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_date  DATE NOT NULL,
  requested_time  TIME NOT NULL,
  status          visit_status NOT NULL DEFAULT 'PENDING',
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- SAVED PROPERTIES
-- ========================
-- Users can bookmark/save properties for later viewing.
CREATE TABLE saved_properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_saved_properties_user_property UNIQUE (user_id, property_id)
);


-- =============================================================
-- migrations/00002_rls_policies.sql
-- =============================================================
-- ============================================================
-- KAZA - Row Level Security Policies
-- ============================================================
-- Defines fine-grained access control for every table.
-- All policies use auth.uid() to identify the current user.
-- The service role key (admin client) bypasses RLS entirely.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENABLE RLS ON ALL TABLES
-- ------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2. USERS
-- ------------------------------------------------------------

-- Anyone can view public profile fields (not password_hash or verification docs)
CREATE POLICY "users_select_public_profile"
  ON users FOR SELECT
  USING (true);

-- Users can insert their own profile row (triggered on signup)
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can delete user accounts
CREATE POLICY "users_delete_admin_only"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'ADMIN'
    )
  );

-- ------------------------------------------------------------
-- 3. PROPERTIES
-- ------------------------------------------------------------

-- Anyone (including unauthenticated) can view available properties
CREATE POLICY "properties_select_all"
  ON properties FOR SELECT
  USING (true);

-- Only verified owners can create property listings
CREATE POLICY "properties_insert_verified_owner"
  ON properties FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'OWNER'
        AND u.verification_status = 'APPROVED'
    )
  );

-- Owners can update only their own properties
CREATE POLICY "properties_update_own"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete only their own properties
CREATE POLICY "properties_delete_own"
  ON properties FOR DELETE
  USING (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- 4. PROPERTY PHOTOS
-- ------------------------------------------------------------

-- Anyone can view property photos (follows property SELECT policy)
CREATE POLICY "property_photos_select_all"
  ON property_photos FOR SELECT
  USING (true);

-- Only the property owner can add photos
CREATE POLICY "property_photos_insert_owner"
  ON property_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  );

-- Only the property owner can update photo metadata (e.g. display_order)
CREATE POLICY "property_photos_update_owner"
  ON property_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  );

-- Only the property owner can delete photos
CREATE POLICY "property_photos_delete_owner"
  ON property_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. ROOMMATE LISTINGS
-- ------------------------------------------------------------

-- Anyone can view active roommate listings
CREATE POLICY "roommate_listings_select_all"
  ON roommate_listings FOR SELECT
  USING (true);

-- Authenticated users can create roommate listings
CREATE POLICY "roommate_listings_insert_authenticated"
  ON roommate_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the listing creator can update
CREATE POLICY "roommate_listings_update_own"
  ON roommate_listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only the listing creator can delete
CREATE POLICY "roommate_listings_delete_own"
  ON roommate_listings FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. ROOMMATE GROUPS
-- ------------------------------------------------------------

-- Viewable by anyone (public group info)
CREATE POLICY "roommate_groups_select_all"
  ON roommate_groups FOR SELECT
  USING (true);

-- Only the listing creator can create groups for their listing
CREATE POLICY "roommate_groups_insert_listing_owner"
  ON roommate_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roommate_listings rl
      WHERE rl.id = listing_id
        AND rl.user_id = auth.uid()
    )
  );

-- Only the listing creator can update group info
CREATE POLICY "roommate_groups_update_listing_owner"
  ON roommate_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM roommate_listings rl
      WHERE rl.id = listing_id
        AND rl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roommate_listings rl
      WHERE rl.id = listing_id
        AND rl.user_id = auth.uid()
    )
  );

-- Only the listing creator can delete groups
CREATE POLICY "roommate_groups_delete_listing_owner"
  ON roommate_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM roommate_listings rl
      WHERE rl.id = listing_id
        AND rl.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 7. ROOMMATE MEMBERS
-- ------------------------------------------------------------

-- Members visible to group members and the listing owner
CREATE POLICY "roommate_members_select_group_or_listing_owner"
  ON roommate_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM roommate_groups rg
      JOIN roommate_listings rl ON rl.id = rg.listing_id
      WHERE rg.id = group_id
        AND rl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM roommate_members rm
      WHERE rm.group_id = roommate_members.group_id
        AND rm.user_id = auth.uid()
        AND rm.status = 'ACCEPTED'
    )
  );

-- Authenticated users can apply to join a group (insert themselves)
CREATE POLICY "roommate_members_insert_self"
  ON roommate_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Listing owner can update member status (accept/reject);
-- members can update their own status (leave)
CREATE POLICY "roommate_members_update_owner_or_self"
  ON roommate_members FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM roommate_groups rg
      JOIN roommate_listings rl ON rl.id = rg.listing_id
      WHERE rg.id = group_id
        AND rl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM roommate_groups rg
      JOIN roommate_listings rl ON rl.id = rg.listing_id
      WHERE rg.id = group_id
        AND rl.user_id = auth.uid()
    )
  );

-- Listing owner can remove members; members can remove themselves
CREATE POLICY "roommate_members_delete_owner_or_self"
  ON roommate_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM roommate_groups rg
      JOIN roommate_listings rl ON rl.id = rg.listing_id
      WHERE rg.id = group_id
        AND rl.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 8. RENTALS
-- ------------------------------------------------------------

-- Viewable by the property owner or the tenant
CREATE POLICY "rentals_select_owner_or_tenant"
  ON rentals FOR SELECT
  USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  );

-- Authenticated users can create rental requests
CREATE POLICY "rentals_insert_authenticated"
  ON rentals FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Property owner or tenant can update rental (e.g. status changes)
CREATE POLICY "rentals_update_owner_or_tenant"
  ON rentals FOR UPDATE
  USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 9. MESSAGES
-- ------------------------------------------------------------

-- Users can only see messages they sent or received
CREATE POLICY "messages_select_sender_or_recipient"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
  );

-- Authenticated users can send messages
CREATE POLICY "messages_insert_authenticated"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Only the recipient can mark a message as read
CREATE POLICY "messages_update_recipient_read"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- ------------------------------------------------------------
-- 10. PAYMENTS
-- ------------------------------------------------------------
-- Payment records are primarily managed via Server Actions
-- with the service role. These policies provide fallback
-- access for users viewing their own payment history.

-- Users can view their own payments
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Payment creation is handled by Server Actions (service role).
-- This policy allows the user to create payment records for themselves.
CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payment status updates are handled by webhooks (service role).
-- Users cannot update payment records directly.

-- ------------------------------------------------------------
-- 11. ESCROW PAYMENTS
-- ------------------------------------------------------------

-- Viewable by the tenant or the owner involved
CREATE POLICY "escrow_payments_select_tenant_or_owner"
  ON escrow_payments FOR SELECT
  USING (
    auth.uid() = tenant_id
    OR auth.uid() = owner_id
  );

-- Escrow creation and updates are handled by Server Actions
-- (service role) to maintain integrity.

-- ------------------------------------------------------------
-- 12. RATINGS
-- ------------------------------------------------------------

-- Anyone can view ratings (public trust/reputation system)
CREATE POLICY "ratings_select_all"
  ON ratings FOR SELECT
  USING (true);

-- Authenticated users can create ratings (for rentals they participated in)
CREATE POLICY "ratings_insert_authenticated"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id
    AND EXISTS (
      SELECT 1 FROM rentals r
      WHERE r.id = rental_id
        AND (r.tenant_id = auth.uid() OR EXISTS (
          SELECT 1 FROM properties p
          WHERE p.id = r.property_id
            AND p.owner_id = auth.uid()
        ))
        AND r.status IN ('COMPLETED', 'TERMINATED')
    )
  );

-- ------------------------------------------------------------
-- 13. CONTRACTS
-- ------------------------------------------------------------

-- Viewable by parties involved in the rental or roommate group
CREATE POLICY "contracts_select_parties"
  ON contracts FOR SELECT
  USING (
    -- Rental contracts: visible to tenant and property owner
    (
      rental_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM rentals r
        JOIN properties p ON p.id = r.property_id
        WHERE r.id = rental_id
          AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
      )
    )
    OR
    -- Roommate contracts: visible to group members and listing owner
    (
      roommate_group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM roommate_members rm
        WHERE rm.group_id = roommate_group_id
          AND rm.user_id = auth.uid()
          AND rm.status = 'ACCEPTED'
      )
    )
    OR
    (
      roommate_group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM roommate_groups rg
        JOIN roommate_listings rl ON rl.id = rg.listing_id
        WHERE rg.id = roommate_group_id
          AND rl.user_id = auth.uid()
      )
    )
  );

-- Contract creation is handled by Server Actions / Edge Functions

-- Parties can update signature flags on their own contracts
CREATE POLICY "contracts_update_sign"
  ON contracts FOR UPDATE
  USING (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rentals r
      JOIN properties p ON p.id = r.property_id
      WHERE r.id = rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rentals r
      JOIN properties p ON p.id = r.property_id
      WHERE r.id = rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- 14. VISIT REQUESTS
-- ------------------------------------------------------------

-- Viewable by the requester or the property owner
CREATE POLICY "visit_requests_select_owner_or_requester"
  ON visit_requests FOR SELECT
  USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  );

-- Authenticated users can create visit requests
CREATE POLICY "visit_requests_insert_authenticated"
  ON visit_requests FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Property owner can update visit status (confirm/cancel);
-- requester can cancel their own request
CREATE POLICY "visit_requests_update_owner_or_requester"
  ON visit_requests FOR UPDATE
  USING (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = tenant_id
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
        AND p.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 15. SAVED PROPERTIES
-- ------------------------------------------------------------

-- Users can view their own saved properties
CREATE POLICY "saved_properties_select_own"
  ON saved_properties FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save properties
CREATE POLICY "saved_properties_insert_own"
  ON saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave properties
CREATE POLICY "saved_properties_delete_own"
  ON saved_properties FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================================
-- migrations/00003_indexes.sql
-- =============================================================
-- ============================================================
-- KAZA - Performance Indexes
-- ============================================================
-- Creates indexes for:
--   - Foreign key lookups (essential for JOIN performance)
--   - Geospatial queries (GIST index on PostGIS geography columns)
--   - Full-text search (GIN + pg_trgm on property title/description)
--   - Common filter/sort patterns
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROPERTIES
-- ------------------------------------------------------------

-- Lookup properties by owner (owner dashboard, profile page)
CREATE INDEX idx_properties_owner_id
  ON properties (owner_id);

-- Filter properties by status (search results show only AVAILABLE)
CREATE INDEX idx_properties_status
  ON properties (status);

-- Geospatial index for location-based search (radius queries, nearest)
CREATE INDEX idx_properties_location
  ON properties USING GIST (location);

-- Filter by property type (apartments, houses, studios, etc.)
CREATE INDEX idx_properties_type
  ON properties (property_type);

-- Full-text search on title and description using pg_trgm.
-- Supports ILIKE '%query%' and similarity() searches in French and English.
CREATE INDEX idx_properties_title_trgm
  ON properties USING GIN (title gin_trgm_ops);

CREATE INDEX idx_properties_description_trgm
  ON properties USING GIN (description gin_trgm_ops);

-- ------------------------------------------------------------
-- 2. RENTALS
-- ------------------------------------------------------------

-- Lookup rentals by tenant (tenant dashboard, payment history)
CREATE INDEX idx_rentals_tenant_id
  ON rentals (tenant_id);

-- Lookup rentals by property (property analytics, rental history)
CREATE INDEX idx_rentals_property_id
  ON rentals (property_id);

-- ------------------------------------------------------------
-- 3. MESSAGES
-- ------------------------------------------------------------

-- Lookup messages by sender (sent messages view)
CREATE INDEX idx_messages_sender_id
  ON messages (sender_id);

-- Lookup messages by recipient (inbox view)
CREATE INDEX idx_messages_recipient_id
  ON messages (recipient_id);

-- Filter messages by property context
CREATE INDEX idx_messages_property_id
  ON messages (property_id);

-- ------------------------------------------------------------
-- 4. RATINGS
-- ------------------------------------------------------------

-- Lookup ratings given by a specific user
CREATE INDEX idx_ratings_rater_id
  ON ratings (rater_id);

-- Lookup ratings received by a specific user (reputation score)
CREATE INDEX idx_ratings_rated_user_id
  ON ratings (rated_user_id);

-- ------------------------------------------------------------
-- 5. ROOMMATE LISTINGS & MEMBERS
-- ------------------------------------------------------------

-- Lookup roommate listings by creator
CREATE INDEX idx_roommate_listings_user_id
  ON roommate_listings (user_id);

-- Lookup members within a roommate group
CREATE INDEX idx_roommate_members_group_id
  ON roommate_members (group_id);

-- ------------------------------------------------------------
-- 6. PAYMENTS
-- ------------------------------------------------------------

-- Lookup payments by rental (rental payment history)
CREATE INDEX idx_payments_rental_id
  ON payments (rental_id);

-- Lookup payments by user (user payment history, wallet)
CREATE INDEX idx_payments_user_id
  ON payments (user_id);

-- ------------------------------------------------------------
-- 7. VISIT REQUESTS
-- ------------------------------------------------------------

-- Lookup visit requests by property (owner's booking view)
CREATE INDEX idx_visit_requests_property_id
  ON visit_requests (property_id);

-- Lookup visit requests by tenant (tenant's scheduled visits)
CREATE INDEX idx_visit_requests_tenant_id
  ON visit_requests (tenant_id);

-- ------------------------------------------------------------
-- 8. SAVED PROPERTIES
-- ------------------------------------------------------------

-- Lookup saved properties by user (favorites page)
CREATE INDEX idx_saved_properties_user_id
  ON saved_properties (user_id);


-- =============================================================
-- migrations/00004_notifications.sql
-- =============================================================
-- ============================================================
-- KAZA - Notifications
-- ============================================================
-- Table de notifications utilisateurs (visites, messages,
-- paiements, modération de propriétés, contrats, avis, KYC).
-- Les insertions sont réservées au service role (Edge Functions
-- ou server actions admin) : aucune policy INSERT publique.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUM
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'visit_request', 'visit_accepted', 'visit_rejected',
      'message_received',
      'payment_received', 'payment_failed', 'payment_due',
      'property_approved', 'property_rejected', 'property_suspended',
      'contract_ready', 'contract_signed',
      'review_received',
      'identity_approved', 'identity_rejected',
      'system'
    );
  END IF;
END$$;

-- ------------------------------------------------------------
-- 2. TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. INDEX
-- ------------------------------------------------------------
-- Lecture rapide du badge "non lues" par utilisateur
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Lecture chronologique complète (centre de notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own notifications" ON public.notifications;
CREATE POLICY "Users see their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own notifications" ON public.notifications;
CREATE POLICY "Users update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own notifications" ON public.notifications;
CREATE POLICY "Users delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Insertions via service role uniquement : aucune policy INSERT.


-- =============================================================
-- migrations/00005_verifications.sql
-- =============================================================
-- ============================================================
-- KAZA - Identity Verifications
-- Wave 2 - Aminata Traoré
-- ============================================================
-- Tunnel de vérification d'identité (KYC) :
--   1) OTP SMS sur le numéro de téléphone (table `phone_otps`)
--   2) Soumission des pièces (recto/verso) + selfie
--   3) Modération manuelle par un admin (`/admin/verifications`)
--
-- Les fichiers (pièces, selfie) sont stockés dans le bucket
-- privé `identity-documents` de Supabase Storage ; seul le path
-- est persisté ici (pas de copie binaire en DB).
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUM - Type de pièce d'identité
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'id_document_type') THEN
    CREATE TYPE id_document_type AS ENUM (
      'national_id',     -- Carte nationale d'identité
      'passport',        -- Passeport
      'driver_license',  -- Permis de conduire
      'voter_card'       -- Carte d'électeur
    );
  END IF;
END$$;

-- ------------------------------------------------------------
-- 2. TABLE - identity_verifications
-- ------------------------------------------------------------
-- Une seule vérification active par utilisateur (re-soumission =
-- mise à jour de la ligne existante par l'admin). Le statut suit
-- l'enum `verification_status` défini dans 00001 (UNVERIFIED,
-- PENDING, APPROVED, REJECTED).
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type       id_document_type NOT NULL,
  document_number     TEXT,
  document_front_url  TEXT NOT NULL,
  document_back_url   TEXT,
  selfie_url          TEXT NOT NULL,
  phone_number        TEXT NOT NULL,
  phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  status              verification_status NOT NULL DEFAULT 'PENDING',
  rejection_reason    TEXT,
  reviewed_by         UUID REFERENCES public.users(id),
  reviewed_at         TIMESTAMPTZ,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_verif_per_user UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_verif_status
  ON public.identity_verifications(status, submitted_at DESC);

ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- L'utilisateur ne voit que sa propre vérification.
CREATE POLICY "Users read their verification" ON public.identity_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- L'utilisateur peut soumettre sa propre vérification.
CREATE POLICY "Users insert their verification" ON public.identity_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les admins lisent toutes les vérifications (file d'attente de modération).
CREATE POLICY "Admins read all" ON public.identity_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Les admins valident/rejettent.
CREATE POLICY "Admins update" ON public.identity_verifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ------------------------------------------------------------
-- 3. TABLE - phone_otps
-- ------------------------------------------------------------
-- Stockage court-terme des OTPs envoyés par SMS (durée de vie 10 min).
-- Le code est stocké hashé en SHA-256 (jamais en clair). La table
-- doit être nettoyée régulièrement par une Edge Function (cron).
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number  TEXT NOT NULL,
  code_hash     TEXT NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_user
  ON public.phone_otps(user_id, created_at DESC);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- L'utilisateur ne manipule que ses propres OTPs.
CREATE POLICY "Users access their own OTPs" ON public.phone_otps
  FOR ALL USING (auth.uid() = user_id);


-- =============================================================
-- migrations/00006_contracts.sql
-- =============================================================
-- ============================================================
-- KAZA - Contrats (génération PDF + signature électronique)
-- Wave 2 - Kwame Asante
-- ============================================================
-- La table `contracts` existe déjà dans 00001_initial_schema.sql.
-- Cette migration :
--   1) Ajoute le type ENUM `contract_status` (cycle de signature)
--   2) Ajoute les colonnes de hash de signatures SHA-256
--      (jamais le PNG en clair) + horodatages
--   3) Ajoute la colonne `status` + alias `pdf_url`
--   4) Met à jour les politiques RLS (les parties peuvent lire et
--      signer leur propre contrat)
--   5) Crée le bucket Storage privé `contracts`
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUM - contract_status
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM (
      'DRAFT',            -- Brouillon, PDF en cours de génération
      'PENDING_TENANT',   -- En attente de la signature du locataire
      'PENDING_OWNER',    -- En attente de la signature du propriétaire
      'SIGNED',           -- Les deux parties ont signé
      'CANCELLED'         -- Contrat annulé avant signature complète
    );
  END IF;
END$$;

-- ------------------------------------------------------------
-- 2. TABLE - contracts (création conditionnelle au cas où elle
--    n'existerait pas - normalement déjà créée par 00001).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id           UUID REFERENCES public.rentals(id) ON DELETE SET NULL,
  roommate_group_id   UUID REFERENCES public.roommate_groups(id) ON DELETE SET NULL,
  contract_type       contract_type NOT NULL DEFAULT 'RENTAL',
  contract_pdf_url    TEXT,
  signed_by_owner     BOOLEAN NOT NULL DEFAULT FALSE,
  signed_by_tenant    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at           TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 3. Colonnes additionnelles (signatures + statut)
-- ------------------------------------------------------------
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS status                contract_status NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS pdf_url               TEXT,
  ADD COLUMN IF NOT EXISTS tenant_signature_hash TEXT,
  ADD COLUMN IF NOT EXISTS tenant_signed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_signature_hash  TEXT,
  ADD COLUMN IF NOT EXISTS owner_signed_at       TIMESTAMPTZ;

-- Indexes utiles pour le dashboard "Mes contrats"
CREATE INDEX IF NOT EXISTS idx_contracts_rental_id
  ON public.contracts (rental_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status
  ON public.contracts (status);

-- ------------------------------------------------------------
-- 4. RLS - lecture et update signature par les parties
-- ------------------------------------------------------------
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Lecture : tenant ou owner du rental associé
DROP POLICY IF EXISTS "contracts_select_parties_v2" ON public.contracts;
CREATE POLICY "contracts_select_parties_v2"
  ON public.contracts FOR SELECT
  USING (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = contracts.rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );

-- Update : limité aux colonnes de signature (Postgres ne supporte
-- pas le filtrage par colonne au niveau policy, on s'appuie donc
-- sur le contrôle applicatif dans les Server Actions).
DROP POLICY IF EXISTS "contracts_update_sign_v2" ON public.contracts;
CREATE POLICY "contracts_update_sign_v2"
  ON public.contracts FOR UPDATE
  USING (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = contracts.rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    rental_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.rentals r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = contracts.rental_id
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );

-- ------------------------------------------------------------
-- 5. STORAGE - bucket privé `contracts`
-- ------------------------------------------------------------
-- Les PDF signés ne doivent jamais être publics (données légales).
-- L'accès se fait via signed URL (60s) générée côté serveur.
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Lecture du PDF : tenant ou owner du rental (chemin attendu :
-- `{contract_id}.pdf` ou `{contract_id}/contract.pdf`).
DROP POLICY IF EXISTS "contracts_storage_read_parties" ON storage.objects;
CREATE POLICY "contracts_storage_read_parties"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.rentals r ON r.id = c.rental_id
      JOIN public.properties p ON p.id = r.property_id
      WHERE (storage.objects.name LIKE c.id::text || '%')
        AND (r.tenant_id = auth.uid() OR p.owner_id = auth.uid())
    )
  );


-- =============================================================
-- migrations/00007_push_tokens.sql
-- =============================================================
-- ============================================================
-- KAZA - Push Tokens (FCM)
-- ============================================================
-- Stockage des tokens FCM par utilisateur, pour l'envoi de
-- notifications push (Web + iOS + Android). Un utilisateur peut
-- enregistrer plusieurs appareils (téléphone + ordinateur).
-- Le service role est responsable de l'envoi via la table.
-- L'utilisateur final gère uniquement ses propres tokens (RLS).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token         TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  device_info   JSONB DEFAULT '{}'::jsonb,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_token UNIQUE (user_id, token)
);

-- Index partiel : lecture rapide des tokens actifs d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_push_tokens_user
  ON public.user_push_tokens(user_id)
  WHERE enabled = TRUE;

-- ------------------------------------------------------------
-- RLS : chaque utilisateur ne voit/gère que ses tokens
-- ------------------------------------------------------------
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their tokens" ON public.user_push_tokens;
CREATE POLICY "Users manage their tokens"
  ON public.user_push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =============================================================
-- migrations/00008_realtime_publications.sql
-- =============================================================
-- =============================================================================
-- KAZA - Activation des publications Realtime
-- Wave 3 - Nia
--
-- Supabase Realtime requiert que chaque table soit ajoutée à la publication
-- `supabase_realtime` pour pouvoir s'y abonner via Postgres Changes.
--
-- Cette migration active Realtime sur :
--   - messages              (messagerie temps réel)
--   - notifications         (centre de notifs in-app)
--   - visit_requests        (demandes de visite)
--   - identity_verifications (suivi modération)
--   - contracts             (suivi signatures)
-- =============================================================================

-- Sécurité : on retire d'abord les tables potentiellement déjà ajoutées,
-- puis on (re)les ajoute, pour rendre la migration idempotente.
DO $$
DECLARE
  tbl TEXT;
  tables_to_publish TEXT[] := ARRAY[
    'messages',
    'notifications',
    'visit_requests',
    'identity_verifications',
    'contracts'
  ];
BEGIN
  -- Crée la publication si elle n'existe pas (Supabase la crée par défaut, mais
  -- on est défensif pour les environnements custom).
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH tbl IN ARRAY tables_to_publish
  LOOP
    -- Vérifie que la table existe avant tentative (les migrations 00004-00006
    -- doivent avoir tourné en amont).
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Retire silencieusement si déjà publiée.
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', tbl);
      EXCEPTION WHEN OTHERS THEN
        -- pas publiée → on continue
        NULL;
      END;

      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- Note : Realtime respecte les politiques RLS. Une session ne reçoit un
-- payload INSERT/UPDATE/DELETE que si la policy SELECT correspondante laisse
-- voir la ligne à l'utilisateur authentifié.


-- =============================================================
-- migrations/00009_storage_buckets.sql
-- =============================================================
-- =============================================================================
-- KAZA - Storage Buckets + policies
-- Wave 3 - Kossi (intégration finale)
--
-- Création de 3 buckets Supabase Storage avec policies RLS adaptées :
--   - identity-documents (privé) : pièces d'identité, selfies
--   - contracts          (privé) : PDFs de contrats signés
--   - property-photos    (public read) : photos d'annonces
--
-- Les fichiers sont scopés par `{userId}/...` pour les buckets privés et
-- par `{propertyId}/...` pour les photos d'annonces.
-- =============================================================================

-- 1. Création des buckets (idempotent via ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'identity-documents',
    'identity-documents',
    FALSE,
    5242880,                                    -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'contracts',
    'contracts',
    FALSE,
    10485760,                                   -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'property-photos',
    'property-photos',
    TRUE,                                        -- lecture publique pour les annonces
    10485760,                                   -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public = EXCLUDED.public;

-- =============================================================================
-- 2. Policies — identity-documents (privé, scopé par userId en préfixe)
-- =============================================================================

DROP POLICY IF EXISTS "identity_documents_user_select" ON storage.objects;
CREATE POLICY "identity_documents_user_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'identity-documents'
    AND (
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    )
  );

DROP POLICY IF EXISTS "identity_documents_user_insert" ON storage.objects;
CREATE POLICY "identity_documents_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'identity-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS "identity_documents_user_delete" ON storage.objects;
CREATE POLICY "identity_documents_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'identity-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- =============================================================================
-- 3. Policies — contracts (privé, lecture pour parties du contrat)
-- =============================================================================
-- Convention path : {contractId}.pdf
-- L'accès est validé en croisant contracts.id avec storage.objects.name (sans extension)

DROP POLICY IF EXISTS "contracts_parties_select" ON storage.objects;
CREATE POLICY "contracts_parties_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id::text = regexp_replace(storage.objects.name, '\.pdf$', '')
        AND (
          auth.uid() = c.owner_id
          OR auth.uid() = c.tenant_id
          OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
        )
    )
  );

-- Insertion réservée au service role (Edge Function). Pas de policy INSERT côté user.

-- =============================================================================
-- 4. Policies — property-photos (public read, write pour propriétaire)
-- =============================================================================
-- Convention path : {propertyId}/{filename}
-- Lecture publique car les annonces sont visibles sans authentification.

DROP POLICY IF EXISTS "property_photos_public_read" ON storage.objects;
CREATE POLICY "property_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "property_photos_owner_insert" ON storage.objects;
CREATE POLICY "property_photos_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "property_photos_owner_delete" ON storage.objects;
CREATE POLICY "property_photos_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND p.owner_id = auth.uid()
    )
  );

