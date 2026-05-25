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
