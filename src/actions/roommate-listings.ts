"use server";

import "server-only";

// =============================================================================
// KAZA — Annonces de colocation (roommate_listings) + demandes de visite
// (roommate_visit_requests, migration 00042).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Création d'annonce
// ---------------------------------------------------------------------------

const listingSchema = z.object({
  title: z.string().trim().min(5, "Titre trop court (5 caractères min).").max(160),
  description: z.string().trim().max(3000).optional().default(""),
  price: z.number().positive("Loyer invalide").max(100_000_000),
  roomSize: z.string().trim().max(60).optional().default(""),
  bedroomsAvailable: z.number().int().min(1).max(20),
  peopleLookingFor: z.number().int().min(1).max(20),
  address: z.string().trim().max(255).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  preferredGender: z.enum(["mixte", "femmes", "hommes"]).default("mixte"),
});

export type ListingInput = z.infer<typeof listingSchema>;

export async function createRoommateListing(
  input: ListingInput,
): Promise<ActionResult> {
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const d = parsed.data;
  const supabase = await loose();
  const { data, error } = await supabase
    .from("roommate_listings")
    .insert({
      user_id: user.id,
      title: d.title,
      description: d.description || null,
      price: d.price,
      room_size: d.roomSize || null,
      bedrooms_available: d.bedroomsAvailable,
      people_looking_for: d.peopleLookingFor,
      address: [d.address, d.city].filter(Boolean).join(", ") || null,
      preferred_profile: { gender: d.preferredGender, city: d.city },
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/student-living");
  revalidatePath("/student/colocations");
  return { success: true, id: (data as { id: string } | null)?.id };
}

// ---------------------------------------------------------------------------
// Demande de visite
// ---------------------------------------------------------------------------

const visitSchema = z.object({
  listingId: z.string().uuid(),
  requestedDate: z.string().optional().default(""),
  requestedTime: z.string().optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
});

export type ColocationVisitInput = z.infer<typeof visitSchema>;

export async function requestColocationVisit(
  input: ColocationVisitInput,
): Promise<ActionResult> {
  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Données invalides." };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const d = parsed.data;
  const supabase = await loose();

  // Récupère l'annonce (créateur à notifier).
  const { data: listing } = await supabase
    .from("roommate_listings")
    .select("id, user_id, title")
    .eq("id", d.listingId)
    .maybeSingle();
  if (!listing) return { success: false, error: "Annonce introuvable." };
  const ownerId = (listing as { user_id: string }).user_id;
  if (ownerId === user.id) {
    return { success: false, error: "C'est votre propre annonce." };
  }

  const { error } = await supabase.from("roommate_visit_requests").insert({
    listing_id: d.listingId,
    requester_id: user.id,
    requested_date: d.requestedDate || null,
    requested_time: d.requestedTime || null,
    message: d.message || null,
    status: "PENDING",
  });
  if (error) return { success: false, error: error.message };

  // Notifie le créateur (best-effort, in-app).
  try {
    await supabase.from("notifications").insert({
      user_id: ownerId,
      type: "visit_request",
      title: "Demande de visite — colocation",
      body: `${user.firstName} souhaite visiter « ${(listing as { title: string }).title} ».`,
      link: `/student-living/${d.listingId}`,
    });
  } catch {
    // non bloquant
  }

  revalidatePath(`/student-living/${d.listingId}`);
  return { success: true };
}

export async function decideColocationVisit(
  id: string,
  status: "CONFIRMED" | "DECLINED",
): Promise<ActionResult> {
  if (!id || (status !== "CONFIRMED" && status !== "DECLINED")) {
    return { success: false, error: "Paramètres invalides." };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const supabase = await loose();
  // RLS garantit que seul le créateur de l'annonce peut mettre à jour.
  const { error } = await supabase
    .from("roommate_visit_requests")
    .update({ status })
    .eq("id", id)
    .eq("status", "PENDING");
  if (error) return { success: false, error: error.message };

  revalidatePath("/student-living");
  return { success: true };
}
