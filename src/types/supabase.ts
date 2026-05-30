/**
 * Supabase Database type definitions.
 *
 * Ce fichier reflète la structure standard produite par
 * `npx supabase gen types typescript`. Chaque table DOIT exposer
 * `Relationships: []` : sans cette clé, postgrest-js v2.99+ collapse
 * les types `Insert`/`Update` en `never` et casse tous les call sites.
 *
 * Pour régénérer depuis le projet Supabase distant :
 *   npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
 *
 * Pensez à fusionner manuellement la table `notifications`
 * (migration 00004) si la regen écrase ce fichier.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          password_hash: string | null
          first_name: string
          last_name: string
          profile_photo_url: string | null
          role: 'TENANT' | 'OWNER' | 'STUDENT' | 'ADMIN'
          is_verified: boolean
          verification_document_url: string | null
          verification_selfie_url: string | null
          verification_status: 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED'
          address: string | null
          bio: string | null
          rating_average: number | null
          notification_prefs: Json
          privacy_prefs: Json
          deletion_requested_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          password_hash?: string | null
          first_name: string
          last_name: string
          profile_photo_url?: string | null
          role?: 'TENANT' | 'OWNER' | 'STUDENT' | 'ADMIN'
          is_verified?: boolean
          verification_document_url?: string | null
          verification_selfie_url?: string | null
          verification_status?: 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED'
          address?: string | null
          bio?: string | null
          rating_average?: number | null
          notification_prefs?: Json
          privacy_prefs?: Json
          deletion_requested_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          password_hash?: string | null
          first_name?: string
          last_name?: string
          profile_photo_url?: string | null
          role?: 'TENANT' | 'OWNER' | 'STUDENT' | 'ADMIN'
          is_verified?: boolean
          verification_document_url?: string | null
          verification_selfie_url?: string | null
          verification_status?: 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED'
          address?: string | null
          bio?: string | null
          rating_average?: number | null
          notification_prefs?: Json
          privacy_prefs?: Json
          deletion_requested_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          price: number
          bedrooms: number | null
          bathrooms: number | null
          square_meters: number | null
          amenities: string[]
          location: unknown | null
          address: string | null
          status: 'DRAFT' | 'PENDING_REVIEW' | 'AVAILABLE' | 'RENTED' | 'UNAVAILABLE' | 'ARCHIVED'
          property_type: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'VILLA' | 'ROOM' | 'SHARED_ROOM' | 'COMMERCIAL' | 'LAND'
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          price: number
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          amenities?: string[]
          location?: unknown | null
          address?: string | null
          status?: 'DRAFT' | 'PENDING_REVIEW' | 'AVAILABLE' | 'RENTED' | 'UNAVAILABLE' | 'ARCHIVED'
          property_type: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'VILLA' | 'ROOM' | 'SHARED_ROOM' | 'COMMERCIAL' | 'LAND'
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          price?: number
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          amenities?: string[]
          location?: unknown | null
          address?: string | null
          status?: 'DRAFT' | 'PENDING_REVIEW' | 'AVAILABLE' | 'RENTED' | 'UNAVAILABLE' | 'ARCHIVED'
          property_type?: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'VILLA' | 'ROOM' | 'SHARED_ROOM' | 'COMMERCIAL' | 'LAND'
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_photos: {
        Row: {
          id: string
          property_id: string
          photo_url: string
          display_order: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          property_id: string
          photo_url: string
          display_order?: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          photo_url?: string
          display_order?: number
          uploaded_at?: string
        }
        Relationships: []
      }
      roommate_listings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          room_size: string | null
          price: number
          bedrooms_available: number
          people_looking_for: number
          preferred_profile: Json | null
          location: unknown | null
          address: string | null
          status: 'ACTIVE' | 'FULL' | 'CLOSED' | 'ARCHIVED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          room_size?: string | null
          price: number
          bedrooms_available?: number
          people_looking_for?: number
          preferred_profile?: Json | null
          location?: unknown | null
          address?: string | null
          status?: 'ACTIVE' | 'FULL' | 'CLOSED' | 'ARCHIVED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          room_size?: string | null
          price?: number
          bedrooms_available?: number
          people_looking_for?: number
          preferred_profile?: Json | null
          location?: unknown | null
          address?: string | null
          status?: 'ACTIVE' | 'FULL' | 'CLOSED' | 'ARCHIVED'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roommate_groups: {
        Row: {
          id: string
          listing_id: string
          group_name: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          group_name: string
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          group_name?: string
          created_at?: string
        }
        Relationships: []
      }
      roommate_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          status: 'INVITED' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LEFT'
          joined_at: string | null
          left_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          status?: 'INVITED' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LEFT'
          joined_at?: string | null
          left_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          status?: 'INVITED' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LEFT'
          joined_at?: string | null
          left_at?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          start_date: string
          end_date: string | null
          monthly_rent: number
          security_deposit: number | null
          status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED'
          contract_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          start_date: string
          end_date?: string | null
          monthly_rent: number
          security_deposit?: number | null
          status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED'
          contract_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          start_date?: string
          end_date?: string | null
          monthly_rent?: number
          security_deposit?: number | null
          status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED'
          contract_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          property_id: string | null
          roommate_listing_id: string | null
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          property_id?: string | null
          roommate_listing_id?: string | null
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          property_id?: string | null
          roommate_listing_id?: string | null
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          rental_id: string
          user_id: string
          amount: number
          payment_method: 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH'
          transaction_id: string | null
          status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
          payment_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rental_id: string
          user_id: string
          amount: number
          payment_method: 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH'
          transaction_id?: string | null
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
          payment_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rental_id?: string
          user_id?: string
          amount?: number
          payment_method?: 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH'
          transaction_id?: string | null
          status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
          payment_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      escrow_payments: {
        Row: {
          id: string
          rental_id: string
          tenant_id: string
          owner_id: string
          total_amount: number
          amount_paid: number
          duration_days: number
          status: 'HELD' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED'
          release_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rental_id: string
          tenant_id: string
          owner_id: string
          total_amount: number
          amount_paid?: number
          duration_days?: number
          status?: 'HELD' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED'
          release_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rental_id?: string
          tenant_id?: string
          owner_id?: string
          total_amount?: number
          amount_paid?: number
          duration_days?: number
          status?: 'HELD' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED'
          release_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          rater_id: string
          rated_user_id: string
          rental_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rater_id: string
          rated_user_id: string
          rental_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rater_id?: string
          rated_user_id?: string
          rental_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          rental_id: string | null
          roommate_group_id: string | null
          contract_type: 'RENTAL' | 'ROOMMATE' | 'SUBLEASE'
          contract_pdf_url: string | null
          pdf_url: string | null
          status: 'DRAFT' | 'PENDING_TENANT' | 'PENDING_OWNER' | 'SIGNED' | 'CANCELLED'
          tenant_signature_hash: string | null
          tenant_signed_at: string | null
          owner_signature_hash: string | null
          owner_signed_at: string | null
          signed_by_owner: boolean
          signed_by_tenant: boolean
          created_at: string
          signed_at: string | null
        }
        Insert: {
          id?: string
          rental_id?: string | null
          roommate_group_id?: string | null
          contract_type: 'RENTAL' | 'ROOMMATE' | 'SUBLEASE'
          contract_pdf_url?: string | null
          pdf_url?: string | null
          status?: 'DRAFT' | 'PENDING_TENANT' | 'PENDING_OWNER' | 'SIGNED' | 'CANCELLED'
          tenant_signature_hash?: string | null
          tenant_signed_at?: string | null
          owner_signature_hash?: string | null
          owner_signed_at?: string | null
          signed_by_owner?: boolean
          signed_by_tenant?: boolean
          created_at?: string
          signed_at?: string | null
        }
        Update: {
          id?: string
          rental_id?: string | null
          roommate_group_id?: string | null
          contract_type?: 'RENTAL' | 'ROOMMATE' | 'SUBLEASE'
          contract_pdf_url?: string | null
          pdf_url?: string | null
          status?: 'DRAFT' | 'PENDING_TENANT' | 'PENDING_OWNER' | 'SIGNED' | 'CANCELLED'
          tenant_signature_hash?: string | null
          tenant_signed_at?: string | null
          owner_signature_hash?: string | null
          owner_signed_at?: string | null
          signed_by_owner?: boolean
          signed_by_tenant?: boolean
          created_at?: string
          signed_at?: string | null
        }
        Relationships: []
      }
      visit_requests: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          requested_date: string
          requested_time: string
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          requested_date: string
          requested_time: string
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          requested_date?: string
          requested_time?: string
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
          message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          id: string
          user_id: string
          property_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type:
            | 'visit_request'
            | 'visit_accepted'
            | 'visit_rejected'
            | 'message_received'
            | 'payment_received'
            | 'payment_failed'
            | 'payment_due'
            | 'property_approved'
            | 'property_rejected'
            | 'property_suspended'
            | 'contract_ready'
            | 'contract_signed'
            | 'review_received'
            | 'identity_approved'
            | 'identity_rejected'
            | 'system'
          title: string
          body: string | null
          link: string | null
          metadata: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type:
            | 'visit_request'
            | 'visit_accepted'
            | 'visit_rejected'
            | 'message_received'
            | 'payment_received'
            | 'payment_failed'
            | 'payment_due'
            | 'property_approved'
            | 'property_rejected'
            | 'property_suspended'
            | 'contract_ready'
            | 'contract_signed'
            | 'review_received'
            | 'identity_approved'
            | 'identity_rejected'
            | 'system'
          title: string
          body?: string | null
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?:
            | 'visit_request'
            | 'visit_accepted'
            | 'visit_rejected'
            | 'message_received'
            | 'payment_received'
            | 'payment_failed'
            | 'payment_due'
            | 'property_approved'
            | 'property_rejected'
            | 'property_suspended'
            | 'contract_ready'
            | 'contract_signed'
            | 'review_received'
            | 'identity_approved'
            | 'identity_rejected'
            | 'system'
          title?: string
          body?: string | null
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          platform: string
          device_info: Json | null
          enabled: boolean
          created_at: string
          last_used_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          platform: string
          device_info?: Json | null
          enabled?: boolean
          created_at?: string
          last_used_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          platform?: string
          device_info?: Json | null
          enabled?: boolean
          created_at?: string
          last_used_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'TENANT' | 'OWNER' | 'STUDENT' | 'ADMIN'
      verification_status: 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED'
      property_status: 'DRAFT' | 'PENDING_REVIEW' | 'AVAILABLE' | 'RENTED' | 'UNAVAILABLE' | 'ARCHIVED'
      property_type: 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'VILLA' | 'ROOM' | 'SHARED_ROOM' | 'COMMERCIAL' | 'LAND'
      rental_status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED'
      payment_method: 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CASH'
      payment_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
      escrow_status: 'HELD' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED'
      visit_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
      roommate_status: 'INVITED' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LEFT'
      contract_type: 'RENTAL' | 'ROOMMATE' | 'SUBLEASE'
      contract_status: 'DRAFT' | 'PENDING_TENANT' | 'PENDING_OWNER' | 'SIGNED' | 'CANCELLED'
      roommate_listing_status: 'ACTIVE' | 'FULL' | 'CLOSED' | 'ARCHIVED'
      notification_type:
        | 'visit_request'
        | 'visit_accepted'
        | 'visit_rejected'
        | 'message_received'
        | 'payment_received'
        | 'payment_failed'
        | 'payment_due'
        | 'property_approved'
        | 'property_rejected'
        | 'property_suspended'
        | 'contract_ready'
        | 'contract_signed'
        | 'review_received'
        | 'identity_approved'
        | 'identity_rejected'
        | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * Convenience type aliases for common table types.
 * Use these in components and server actions for type safety.
 *
 * Example:
 *   import type { Tables, TablesInsert } from '@/types/supabase'
 *   const property: Tables<'properties'> = ...
 *   const newUser: TablesInsert<'users'> = { email: '...', first_name: '...', last_name: '...' }
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
