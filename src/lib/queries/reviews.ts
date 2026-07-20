import "server-only";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries Reviews (server-side)
// Lecture des avis (`ratings`) prêts à afficher.
// Empty array si rien — pas d'erreur côté UI.
// =============================================================================

export interface PropertyReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerInitials: string;
}

export interface PropertyReviewsResult {
  reviews: PropertyReview[];
  averageRating: number;
  totalCount: number;
}

/**
 * Renvoie les avis publiés sur une propriété, triés du plus récent au plus
 * ancien, ainsi que la note moyenne et le nombre total.
 *
 * Note : `ratings` n'a pas de FK `property_id` directe — on remonte via
 * `rentals.property_id`. On filtre côté Postgres par `rentals.property_id`.
 */
export async function getPropertyReviews(
  propertyId: string,
): Promise<PropertyReviewsResult> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select(
      `
      id, rating, comment, created_at,
      rental:rentals!inner(property_id),
      reviewer:users!rater_id(first_name, last_name)
    `,
    )
    .eq("rental.property_id", propertyId)
    .order("created_at", { ascending: false });

  const list = (data ?? []) as unknown as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer:
      | { first_name: string | null; last_name: string | null }
      | { first_name: string | null; last_name: string | null }[]
      | null;
  }>;

  const reviews: PropertyReview[] = list.map((r) => {
    const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
    const first = reviewer?.first_name ?? "";
    const last = reviewer?.last_name ?? "";
    const fullName = `${first} ${last}`.trim();
    const initials =
      `${(first?.[0] ?? "?").toUpperCase()}${(last?.[0] ?? "?").toUpperCase()}`;
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? "",
      createdAt: r.created_at,
      reviewerName: fullName || "Anonyme",
      reviewerInitials: initials,
    };
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return {
    reviews,
    averageRating: Math.round(avg * 10) / 10,
    totalCount: reviews.length,
  };
}

// ---------------------------------------------------------------------------
// Reviewable rentals (côté locataire)
// ---------------------------------------------------------------------------

export interface ReviewableRental {
  id: string;
  status: "ACTIVE" | "COMPLETED";
  startDate: string;
  endDate: string | null;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerFirstName: string;
  ownerLastName: string;
}

/**
 * Liste les locations du locataire courant qu'il peut encore évaluer :
 *  - status ∈ {ACTIVE, COMPLETED}
 *  - aucune review existante créée par ce tenant pour ce rental.
 */
export async function listReviewableRentalsForTenant(
  tenantId: string,
): Promise<ReviewableRental[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rentals")
    .select(
      `
      id, status, start_date, end_date,
      property:properties!property_id(
        id, title, address,
        owner:users!owner_id(first_name, last_name)
      ),
      ratings:ratings!rental_id(id, rater_id)
    `,
    )
    .eq("tenant_id", tenantId)
    .in("status", ["ACTIVE", "COMPLETED"])
    .order("start_date", { ascending: false });

  const list = (data ?? []) as unknown as Array<{
    id: string;
    status: "ACTIVE" | "COMPLETED";
    start_date: string;
    end_date: string | null;
    property:
      | {
          id: string;
          title: string | null;
          address: string | null;
          owner:
            | { first_name: string | null; last_name: string | null }
            | { first_name: string | null; last_name: string | null }[]
            | null;
        }
      | {
          id: string;
          title: string | null;
          address: string | null;
          owner:
            | { first_name: string | null; last_name: string | null }
            | { first_name: string | null; last_name: string | null }[]
            | null;
        }[]
      | null;
    ratings: Array<{ id: string; rater_id: string }> | null;
  }>;

  return list
    .filter(
      (r) => !(r.ratings ?? []).some((rt) => rt.rater_id === tenantId),
    )
    .map((r) => {
      const property = Array.isArray(r.property) ? r.property[0] : r.property;
      const owner = property
        ? Array.isArray(property.owner)
          ? property.owner[0]
          : property.owner
        : null;
      return {
        id: r.id,
        status: r.status,
        startDate: r.start_date,
        endDate: r.end_date,
        propertyId: property?.id ?? "",
        propertyTitle: property?.title ?? "",
        propertyAddress: property?.address ?? "",
        ownerFirstName: owner?.first_name ?? "",
        ownerLastName: owner?.last_name ?? "",
      };
    });
}

// ---------------------------------------------------------------------------
// Tenant reviews (historique)
// ---------------------------------------------------------------------------

export interface TenantReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerFirstName: string;
  ownerLastName: string;
}

/**
 * Historique des avis déposés par le locataire courant.
 */
export async function listTenantReviews(
  tenantId: string,
): Promise<TenantReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select(
      `
      id, rating, comment, created_at,
      rental:rentals!rental_id(
        property:properties!property_id(
          id, title, address,
          owner:users!owner_id(first_name, last_name)
        )
      )
    `,
    )
    .eq("rater_id", tenantId)
    .order("created_at", { ascending: false });

  const list = (data ?? []) as unknown as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    rental:
      | {
          property:
            | {
                id: string;
                title: string | null;
                address: string | null;
                owner:
                  | { first_name: string | null; last_name: string | null }
                  | { first_name: string | null; last_name: string | null }[]
                  | null;
              }
            | {
                id: string;
                title: string | null;
                address: string | null;
                owner:
                  | { first_name: string | null; last_name: string | null }
                  | { first_name: string | null; last_name: string | null }[]
                  | null;
              }[]
            | null;
        }
      | {
          property:
            | {
                id: string;
                title: string | null;
                address: string | null;
                owner:
                  | { first_name: string | null; last_name: string | null }
                  | { first_name: string | null; last_name: string | null }[]
                  | null;
              }
            | {
                id: string;
                title: string | null;
                address: string | null;
                owner:
                  | { first_name: string | null; last_name: string | null }
                  | { first_name: string | null; last_name: string | null }[]
                  | null;
              }[]
            | null;
        }[]
      | null;
  }>;

  return list.map((r) => {
    const rental = Array.isArray(r.rental) ? r.rental[0] : r.rental;
    const property = rental
      ? Array.isArray(rental.property)
        ? rental.property[0]
        : rental.property
      : null;
    const owner = property
      ? Array.isArray(property.owner)
        ? property.owner[0]
        : property.owner
      : null;
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? "",
      createdAt: r.created_at,
      propertyId: property?.id ?? "",
      propertyTitle: property?.title ?? "",
      propertyAddress: property?.address ?? "",
      ownerFirstName: owner?.first_name ?? "",
      ownerLastName: owner?.last_name ?? "",
    };
  });
}

// ---------------------------------------------------------------------------
// Reviews reçues par un propriétaire (toutes ses propriétés)
// ---------------------------------------------------------------------------

export interface OwnerReceivedReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  propertyId: string;
  propertyTitle: string;
  reviewerFirstName: string;
  reviewerLastName: string;
}

/**
 * Avis reçus par un propriétaire sur l'ensemble de ses biens.
 * On joint ratings → rentals → properties (filtre owner_id) + reviewer user.
 */
export async function listOwnerReceivedReviews(
  ownerId: string,
): Promise<OwnerReceivedReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select(
      `
      id, rating, comment, created_at,
      rental:rentals!inner(
        property:properties!inner(id, title, owner_id)
      ),
      reviewer:users!rater_id(first_name, last_name)
    `,
    )
    .eq("rental.property.owner_id", ownerId)
    .order("created_at", { ascending: false });

  const list = (data ?? []) as unknown as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    rental:
      | {
          property:
            | { id: string; title: string | null; owner_id: string }
            | { id: string; title: string | null; owner_id: string }[]
            | null;
        }
      | null;
    reviewer:
      | { first_name: string | null; last_name: string | null }
      | { first_name: string | null; last_name: string | null }[]
      | null;
  }>;

  return list.map((r) => {
    const rental = r.rental;
    const property = rental
      ? Array.isArray(rental.property)
        ? rental.property[0]
        : rental.property
      : null;
    const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? "",
      createdAt: r.created_at,
      propertyId: property?.id ?? "",
      propertyTitle: property?.title ?? "",
      reviewerFirstName: reviewer?.first_name ?? "",
      reviewerLastName: reviewer?.last_name ?? "",
    };
  });
}
