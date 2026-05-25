// =============================================================================
// KAZA - Payment Types
// Aligned with the SQL schema defined in PRD (payments, escrow_payments tables)
// =============================================================================

// ---------------------------------------------------------------------------
// Enum-like union types
// ---------------------------------------------------------------------------

/** Supported payment methods */
export type PaymentMethod = "MOBILE_MONEY" | "BANK_TRANSFER" | "CARD";

/** Status of a payment transaction */
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

/** Status of an escrow payment (V2 feature) */
export type EscrowStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/** Represents a row in the `payments` table */
export interface Payment {
  id: string; // UUID
  rental_id: string; // FK -> rentals
  user_id: string; // FK -> users
  amount: number; // XOF
  payment_method: PaymentMethod;
  transaction_id: string | null; // FedaPay / Kkiapay transaction reference
  status: PaymentStatus;
  payment_date: string | null; // ISO timestamp (when payment was completed)
  created_at: string; // ISO timestamp
}

/** Payment with rental and user details (for payment history pages) */
export interface PaymentWithDetails extends Payment {
  rental: {
    id: string;
    property_id: string;
    monthly_rent: number;
  };
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Represents a row in the `escrow_payments` table (V2 feature).
 * Escrow holds the tenant's deposit until conditions are met (e.g., move-in
 * inspection), then releases funds to the owner.
 */
export interface EscrowPayment {
  id: string; // UUID
  rental_id: string; // FK -> rentals
  tenant_id: string; // FK -> users
  owner_id: string; // FK -> users
  total_amount: number; // XOF
  amount_paid: number; // XOF (can be partial)
  duration_days: number; // Hold duration (default 30)
  status: EscrowStatus;
  release_date: string | null; // ISO timestamp (when funds are released to owner)
  created_at: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Payment initiation payloads (used by Server Actions)
// ---------------------------------------------------------------------------

/** Payload sent to the Server Action to initiate a payment */
export interface InitiatePaymentPayload {
  rental_id: string;
  amount: number; // XOF
  payment_method: PaymentMethod;
}

/** Response from payment initiation (FedaPay token + redirect URL) */
export interface PaymentInitiationResponse {
  success: boolean;
  payment_id: string;
  transaction_token: string | null;
  redirect_url: string | null;
  error: string | null;
}

/** Webhook payload from FedaPay (simplified) */
export interface FedaPayWebhookPayload {
  event: string; // e.g. "transaction.approved", "transaction.declined"
  entity: {
    id: number;
    reference: string;
    amount: number;
    status: string;
    currency: {
      iso: string; // "XOF"
    };
    mode: string; // "mtn", "moov", etc.
    customer: {
      firstname: string;
      lastname: string;
      email: string;
      phone_number: {
        number: string;
        country: string;
      };
    };
    created_at: string;
    updated_at: string;
  };
}

// ---------------------------------------------------------------------------
// Payment summary (for dashboard analytics)
// ---------------------------------------------------------------------------

/** Monthly payment summary for owner or tenant dashboards */
export interface PaymentSummary {
  total_received: number; // XOF
  total_pending: number; // XOF
  payments_count: number;
  last_payment_date: string | null; // ISO timestamp
}
