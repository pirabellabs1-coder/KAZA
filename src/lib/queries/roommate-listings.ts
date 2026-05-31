import "server-only";

// =============================================================================
// KAZA — Requêtes annonces de colocation (roommate_listings) + visites.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "Étudiant";
}

export interface RoommateListingDetail {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string | null;
  title: string;
  description: string | null;
  price: number;
  roomSize: string | null;
  bedroomsAvailable: number;
  peopleLookingFor: number;
  address: string | null;
  preferredGender: string;
  status: string;
  createdAt: string;
}

export async function getRoommateListing(
  id: string,
): Promise<RoommateListingDetail | null> {
  if (!id) return null;
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("roommate_listings")
      .select(
        "id, user_id, title, description, price, room_size, bedrooms_available, people_looking_for, address, preferred_profile, status, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const l = data as {
      id: string;
      user_id: string;
      title: string;
      description: string | null;
      price: number;
      room_size: string | null;
      bedrooms_available: number;
      people_looking_for: number;
      address: string | null;
      preferred_profile: { gender?: string } | null;
      status: string;
      created_at: string;
    };

    const { data: owner } = await supabase
      .from("users")
      .select("first_name, last_name, profile_photo_url")
      .eq("id", l.user_id)
      .maybeSingle();
    const o = owner as {
      first_name: string | null;
      last_name: string | null;
      profile_photo_url: string | null;
    } | null;

    return {
      id: l.id,
      ownerId: l.user_id,
      ownerName: fullName(o?.first_name, o?.last_name),
      ownerAvatar: o?.profile_photo_url ?? null,
      title: l.title,
      description: l.description,
      price: Number(l.price),
      roomSize: l.room_size,
      bedroomsAvailable: l.bedrooms_available,
      peopleLookingFor: l.people_looking_for,
      address: l.address,
      preferredGender: l.preferred_profile?.gender ?? "mixte",
      status: l.status,
      createdAt: l.created_at,
    };
  } catch {
    return null;
  }
}

export interface ListingVisitRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requestedDate: string | null;
  requestedTime: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

export async function listListingVisitRequests(
  listingId: string,
): Promise<ListingVisitRequest[]> {
  if (!listingId) return [];
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("roommate_visit_requests")
      .select(
        "id, requester_id, requested_date, requested_time, message, status, created_at",
      )
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Array<{
      id: string;
      requester_id: string;
      requested_date: string | null;
      requested_time: string | null;
      message: string | null;
      status: string;
      created_at: string;
    }>;
    if (rows.length === 0) return [];

    const ids = [...new Set(rows.map((r) => r.requester_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in("id", ids);
    const nameMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>).map((u) => [u.id, fullName(u.first_name, u.last_name)]),
    );

    return rows.map((r) => ({
      id: r.id,
      requesterId: r.requester_id,
      requesterName: nameMap.get(r.requester_id) ?? "Étudiant",
      requestedDate: r.requested_date,
      requestedTime: r.requested_time,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}
