import "server-only";

// =============================================================================
// Kaabo — Demandes de colocation de l'étudiant (réelles)
// roommate_members (statut) → roommate_groups (listing) → roommate_listings.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export interface StudentRequest {
  id: string;
  listingTitle: string;
  address: string;
  price: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  appliedDate: string | null;
}

function mapStatus(s: string): StudentRequest["status"] {
  if (s === "ACCEPTED") return "APPROVED";
  if (s === "REJECTED" || s === "LEFT") return "REJECTED";
  return "PENDING"; // PENDING, INVITED
}

export async function listStudentRequests(
  userId: string,
): Promise<StudentRequest[]> {
  if (!userId) return [];
  try {
    const supabase = await loose();

    const { data: members } = await supabase
      .from("roommate_members")
      .select("id, group_id, status, joined_at")
      .eq("user_id", userId);
    const memberRows = (members ?? []) as Array<{
      id: string;
      group_id: string;
      status: string;
      joined_at: string | null;
    }>;
    if (memberRows.length === 0) return [];

    const groupIds = [...new Set(memberRows.map((m) => m.group_id))];
    const { data: groups } = await supabase
      .from("roommate_groups")
      .select("id, listing_id")
      .in("id", groupIds);
    const groupToListing = new Map(
      ((groups ?? []) as Array<{ id: string; listing_id: string }>).map((g) => [
        g.id,
        g.listing_id,
      ]),
    );

    const listingIds = [...new Set([...groupToListing.values()])];
    const listingMap = new Map<
      string,
      { title: string; address: string; price: number }
    >();
    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from("roommate_listings")
        .select("id, title, address, price")
        .in("id", listingIds);
      for (const l of (listings ?? []) as Array<{
        id: string;
        title: string;
        address: string | null;
        price: number;
      }>) {
        listingMap.set(l.id, {
          title: l.title,
          address: l.address ?? "",
          price: Number(l.price),
        });
      }
    }

    return memberRows.map((m) => {
      const listingId = groupToListing.get(m.group_id);
      const listing = listingId ? listingMap.get(listingId) : undefined;
      return {
        id: m.id,
        listingTitle: listing?.title ?? "Colocation",
        address: listing?.address ?? "",
        price: listing?.price ?? 0,
        status: mapStatus(m.status),
        appliedDate: m.joined_at,
      };
    });
  } catch {
    return [];
  }
}
