// =============================================================================
// KAZA - User Types
// Aligned with the SQL schema defined in PRD (users table)
// =============================================================================

/** Roles available for users on the KAZA platform */
export type UserRole =
  | "OWNER"
  | "TENANT"
  | "STUDENT"
  | "AGENCY"
  | "BUYER"
  | "ADMIN";

/** Status of identity verification (KYC) */
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Represents a user record from the `users` table */
export interface User {
  id: string; // UUID
  email: string;
  phone: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  role: UserRole;
  is_verified: boolean;
  verification_document_url: string | null;
  verification_selfie_url: string | null;
  verification_status: VerificationStatus;
  address: string | null;
  bio: string | null;
  rating_average: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Public-facing user profile (excludes sensitive fields like password_hash,
 * verification documents, etc.). Suitable for display in property listings,
 * messages, and ratings.
 */
export interface UserPublicProfile {
  id: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  role: UserRole;
  is_verified: boolean;
  verification_status: VerificationStatus;
  bio: string | null;
  rating_average: number;
  created_at: string;
}

/**
 * Authenticated user session data, returned after login.
 * Contains everything needed to render the dashboard and enforce
 * role-based access without additional queries.
 */
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  role: UserRole;
  is_verified: boolean;
  verification_status: VerificationStatus;
}

/** Payload for creating a new user (signup) */
export interface CreateUserPayload {
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Exclude<UserRole, "ADMIN">; // Admin accounts are not self-registered
}

/** Payload for updating a user profile */
export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_photo_url?: string | null;
  address?: string | null;
  bio?: string | null;
}
