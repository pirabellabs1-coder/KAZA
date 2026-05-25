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
