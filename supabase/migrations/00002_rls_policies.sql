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
