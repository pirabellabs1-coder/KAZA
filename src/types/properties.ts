// =============================================================================
// KAZA - Property & Related Types
// Aligned with the SQL schema defined in PRD
// =============================================================================

import type { UserPublicProfile } from "./users";

// ---------------------------------------------------------------------------
// Enum-like union types
// ---------------------------------------------------------------------------

/** Status of a property listing */
export type PropertyStatus = "AVAILABLE" | "RENTED" | "ARCHIVED";

/** Type of property */
export type PropertyType = "APARTMENT" | "HOUSE" | "ROOM" | "STUDIO";

/** Status of a rental agreement */
export type RentalStatus = "PENDING" | "ACTIVE" | "ENDED" | "CANCELLED";

/** Status of a visit request */
export type VisitRequestStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

/** Status of a roommate listing */
export type RoommateListingStatus = "OPEN" | "FULL" | "CLOSED";

/** Status of a roommate member within a group */
export type RoommateMemberStatus = "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "LEFT";

/** Type of contract */
export type ContractType = "RENTAL" | "ROOMMATE";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/** Represents a row in the `properties` table */
export interface Property {
  id: string; // UUID
  owner_id: string; // FK -> users
  title: string;
  description: string | null;
  price: number; // XOF per month
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  amenities: string[]; // e.g. ["WiFi", "Parking", "Climatisation"]
  location_latitude: number | null;
  location_longitude: number | null;
  address: string;
  status: PropertyStatus;
  property_type: PropertyType;
  views_count: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Represents a row in the `property_photos` table */
export interface PropertyPhoto {
  id: string; // UUID
  property_id: string; // FK -> properties
  photo_url: string;
  display_order: number | null;
  uploaded_at: string; // ISO timestamp
}

/** Property with its associated photos (common query result) */
export interface PropertyWithPhotos extends Property {
  photos: PropertyPhoto[];
}

/** Property with photos and owner profile (for detail pages) */
export interface PropertyWithOwner extends PropertyWithPhotos {
  owner: UserPublicProfile;
}

// ---------------------------------------------------------------------------
// Roommate / Student Living
// ---------------------------------------------------------------------------

/**
 * Preferred profile criteria for roommate matching.
 * Stored as JSONB in the database.
 */
export interface RoommatePreferredProfile {
  age_min?: number;
  age_max?: number;
  gender?: "MALE" | "FEMALE" | "ANY";
  discipline?: string; // e.g. "Sciences", "Droit", "Medecine"
  is_smoker?: boolean;
  is_quiet?: boolean;
}

/** Represents a row in the `roommate_listings` table */
export interface RoommateListing {
  id: string; // UUID
  user_id: string; // FK -> users
  title: string;
  description: string | null;
  room_size: string | null; // e.g. "12m2", "Grande chambre"
  price: number; // XOF per month per person
  bedrooms_available: number | null;
  people_looking_for: number | null;
  preferred_profile: RoommatePreferredProfile | null;
  location_latitude: number | null;
  location_longitude: number | null;
  address: string;
  status: RoommateListingStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Roommate listing with creator profile (for listing pages) */
export interface RoommateListingWithUser extends RoommateListing {
  user: UserPublicProfile;
}

/** Represents a row in the `roommate_groups` table */
export interface RoommateGroup {
  id: string; // UUID
  listing_id: string; // FK -> roommate_listings
  group_name: string | null;
  created_at: string; // ISO timestamp
}

/** Represents a row in the `roommate_members` table */
export interface RoommateMember {
  id: string; // UUID
  group_id: string; // FK -> roommate_groups
  user_id: string; // FK -> users
  status: RoommateMemberStatus;
  joined_at: string | null; // ISO timestamp
  left_at: string | null; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Rentals
// ---------------------------------------------------------------------------

/** Represents a row in the `rentals` table */
export interface Rental {
  id: string; // UUID
  property_id: string; // FK -> properties
  tenant_id: string; // FK -> users
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string | null; // ISO date
  monthly_rent: number; // XOF
  security_deposit: number | null; // XOF
  status: RentalStatus;
  contract_url: string | null;
  created_at: string; // ISO timestamp
}

/** Rental with associated property and tenant details */
export interface RentalWithDetails extends Rental {
  property: PropertyWithPhotos;
  tenant: UserPublicProfile;
}

// ---------------------------------------------------------------------------
// Visit Requests
// ---------------------------------------------------------------------------

/** Represents a row in the `visit_requests` table */
export interface VisitRequest {
  id: string; // UUID
  property_id: string; // FK -> properties
  tenant_id: string; // FK -> users
  requested_date: string; // ISO date (YYYY-MM-DD)
  requested_time: string | null; // HH:MM:SS
  status: VisitRequestStatus;
  created_at: string; // ISO timestamp
}

/** Visit request with related property and tenant info */
export interface VisitRequestWithDetails extends VisitRequest {
  property: Property;
  tenant: UserPublicProfile;
}

// ---------------------------------------------------------------------------
// Saved Properties (Favorites)
// ---------------------------------------------------------------------------

/** Represents a row in the `saved_properties` table */
export interface SavedProperty {
  id: string; // UUID
  user_id: string; // FK -> users
  property_id: string; // FK -> properties
  created_at: string; // ISO timestamp
}

/** Saved property with full property details (for favorites page) */
export interface SavedPropertyWithDetails extends SavedProperty {
  property: PropertyWithPhotos;
}

// ---------------------------------------------------------------------------
// Ratings / Reviews
// ---------------------------------------------------------------------------

/** Represents a row in the `ratings` table */
export interface Rating {
  id: string; // UUID
  rater_id: string; // FK -> users
  rated_user_id: string; // FK -> users
  rental_id: string; // FK -> rentals
  rating: number; // 1-5
  comment: string | null;
  created_at: string; // ISO timestamp
}

/** Rating with rater profile info (for display) */
export interface RatingWithRater extends Rating {
  rater: UserPublicProfile;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** Represents a row in the `messages` table */
export interface Message {
  id: string; // UUID
  sender_id: string; // FK -> users
  recipient_id: string; // FK -> users
  property_id: string | null; // FK -> properties (optional context)
  roommate_listing_id: string | null; // FK -> roommate_listings (optional context)
  content: string;
  is_read: boolean;
  created_at: string; // ISO timestamp
}

/** Message with sender profile (for chat display) */
export interface MessageWithSender extends Message {
  sender: UserPublicProfile;
}

/** A conversation summary for the conversation list */
export interface ConversationSummary {
  other_user: UserPublicProfile;
  last_message: Message;
  unread_count: number;
  property_id: string | null;
  roommate_listing_id: string | null;
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/** Represents a row in the `contracts` table */
export interface Contract {
  id: string; // UUID
  rental_id: string | null; // FK -> rentals
  roommate_group_id: string | null; // FK -> roommate_groups
  contract_type: ContractType;
  contract_pdf_url: string;
  signed_by_owner: boolean;
  signed_by_tenant: boolean;
  created_at: string; // ISO timestamp
  signed_at: string | null; // ISO timestamp
}
