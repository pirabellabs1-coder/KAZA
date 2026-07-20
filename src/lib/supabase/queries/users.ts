// =============================================================================
// Kaabo - Users Queries (Server Components)
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { AuthUser, User, UserPublicProfile } from "@/types/users";

// TODO: type manquant - `Database` (src/types/supabase.ts) ne fournit pas
// `Relationships: []` ce qui casse l'inference postgrest-js v2.99. On
// utilise un client loose le temps que les types soient regeneres.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// getUserById
// ---------------------------------------------------------------------------

/** Profil public d'un utilisateur (sans donnees sensibles). */
export async function getUserById(
  id: string
): Promise<UserPublicProfile | null> {
  const supabase = await getLooseClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      first_name,
      last_name,
      profile_photo_url,
      role,
      is_verified,
      verification_status,
      bio,
      rating_average,
      created_at
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture du profil impossible : ${error.message}`);
  }

  if (!data) return null;
  // TODO: type manquant - `verification_status` cote types/users.ts ne couvre
  // pas 'UNVERIFIED' (present cote DB). On cast prudemment.
  return {
    ...data,
    rating_average: data.rating_average ?? 0,
  } as unknown as UserPublicProfile;
}

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------

/**
 * Recupere l'utilisateur courant (session) avec son profil complet.
 * Retourne `null` si non connecte.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await getLooseClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      phone,
      first_name,
      last_name,
      profile_photo_url,
      role,
      is_verified,
      verification_status
    `
    )
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    phone: data.phone ?? "",
  } as unknown as AuthUser;
}

// ---------------------------------------------------------------------------
// getOwnerStats
// ---------------------------------------------------------------------------

export interface OwnerStats {
  totalProperties: number;
  activeListings: number;
  pendingVisits: number;
  totalRevenue: number;
}

/**
 * Statistiques d'un proprietaire pour le dashboard :
 *  - totalProperties : toutes les annonces (tous statuts)
 *  - activeListings : annonces AVAILABLE
 *  - pendingVisits : demandes de visite PENDING sur ses annonces
 *  - totalRevenue : somme des paiements COMPLETED sur ses locations
 */
export async function getOwnerStats(ownerId: string): Promise<OwnerStats> {
  const supabase = await getLooseClient();

  const [
    { count: totalProperties },
    { count: activeListings },
    propertiesResult,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .eq("status", "AVAILABLE"),
    supabase.from("properties").select("id").eq("owner_id", ownerId),
  ]);

  const propertyIds = (propertiesResult.data ?? []).map((p) => p.id);

  let pendingVisits = 0;
  let totalRevenue = 0;

  if (propertyIds.length > 0) {
    const { count: visitsCount } = await supabase
      .from("visit_requests")
      .select("id", { count: "exact", head: true })
      .in("property_id", propertyIds)
      .eq("status", "PENDING");

    pendingVisits = visitsCount ?? 0;

    const { data: rentals } = await supabase
      .from("rentals")
      .select("id")
      .in("property_id", propertyIds);

    const rentalIds = (rentals ?? []).map((r) => r.id);

    if (rentalIds.length > 0) {
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .in("rental_id", rentalIds)
        .eq("status", "COMPLETED");

      totalRevenue = (payments ?? []).reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0
      );
    }
  }

  return {
    totalProperties: totalProperties ?? 0,
    activeListings: activeListings ?? 0,
    pendingVisits,
    totalRevenue,
  };
}

// ---------------------------------------------------------------------------
// getFullUserById (interne, peu utilise)
// ---------------------------------------------------------------------------

/**
 * Variante "complete" pour les contextes admin. Retourne la ligne entiere.
 */
export async function getFullUserById(id: string): Promise<User | null> {
  const supabase = await getLooseClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as User;
}
