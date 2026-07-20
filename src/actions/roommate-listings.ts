"use server";

import "server-only";

// =============================================================================
// Kaabo — Annonces de colocation (roommate_listings) + demandes de visite
// (roommate_visit_requests, migration 00042).
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

/**
 * Garantit qu'un groupe de colocation existe pour une annonce, avec son
 * créateur comme colocataire PRINCIPAL (is_lead). Retourne l'id du groupe.
 * Idempotent — réutilise le groupe existant.
 */
async function ensureColocationGroup(
  listingId: string,
  leadUserId: string,
  groupName: string,
): Promise<string | null> {
  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: existing } = await admin
    .from("roommate_groups")
    .select("id")
    .eq("listing_id", listingId)
    .limit(1);
  const found = (existing as Array<{ id: string }> | null)?.[0];
  let groupId = found?.id ?? null;

  if (!groupId) {
    const { data: g, error } = await admin
      .from("roommate_groups")
      .insert({ listing_id: listingId, group_name: groupName })
      .select("id")
      .single();
    if (error || !g) {
      console.error("[coloc] création groupe échec:", error?.message);
      return null;
    }
    groupId = (g as { id: string }).id;
  }

  // Le créateur devient membre PRINCIPAL (ACCEPTED) s'il ne l'est pas déjà.
  const { data: lead } = await admin
    .from("roommate_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", leadUserId)
    .limit(1);
  if (!((lead as Array<{ id: string }> | null)?.[0])) {
    await admin.from("roommate_members").insert({
      group_id: groupId,
      user_id: leadUserId,
      status: "ACCEPTED",
      is_lead: true,
      joined_at: new Date().toISOString(),
    });
  }
  return groupId;
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

  const listingId = (data as { id: string } | null)?.id;
  // Crée le groupe de colocation + désigne le créateur comme PRINCIPAL.
  if (listingId) {
    await ensureColocationGroup(listingId, user.id, d.title);
  }

  revalidatePath("/student-living");
  revalidatePath("/student/colocations");
  return { success: true, id: listingId };
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

  // Notifie le DEMANDEUR de la décision (confirmée / déclinée). Best-effort.
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const { data: vr } = await admin
      .from("roommate_visit_requests")
      .select("requester_id, listing_id")
      .eq("id", id)
      .maybeSingle();
    const req = vr as { requester_id: string; listing_id: string } | null;
    if (req?.requester_id) {
      const { data: listing } = await admin
        .from("roommate_listings")
        .select("title")
        .eq("id", req.listing_id)
        .maybeSingle();
      const title =
        (listing as { title?: string } | null)?.title ?? "la colocation";
      await admin.from("notifications").insert({
        user_id: req.requester_id,
        type: status === "CONFIRMED" ? "visit_accepted" : "visit_rejected",
        title:
          status === "CONFIRMED"
            ? "Visite de colocation confirmée"
            : "Visite de colocation déclinée",
        body:
          status === "CONFIRMED"
            ? `Votre demande de visite pour « ${title} » a été confirmée.`
            : `Votre demande de visite pour « ${title} » a été déclinée.`,
        link: `/student-living/${req.listing_id}`,
      });
    }
  } catch (err) {
    console.warn("[coloc] notif visite décidée échec:", err);
  }

  revalidatePath("/student-living");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Rejoindre une colocation (candidat) — le PRINCIPAL valide ensuite l'identité
// ---------------------------------------------------------------------------

/**
 * Le candidat demande à rejoindre la colocation d'une annonce. Une ligne
 * `roommate_members` est créée en statut PENDING ; le colocataire principal
 * devra l'ACCEPTER (après avoir vérifié son identité) ou la REFUSER.
 */
export async function requestToJoinColocation(
  listingId: string,
): Promise<ActionResult> {
  if (!listingId) return { success: false, error: "Annonce introuvable." };
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: listing } = await admin
    .from("roommate_listings")
    .select("id, user_id, title")
    .eq("id", listingId)
    .maybeSingle();
  const l = listing as { id: string; user_id: string; title: string } | null;
  if (!l) return { success: false, error: "Annonce introuvable." };
  if (l.user_id === user.id) {
    return { success: false, error: "C'est votre propre colocation." };
  }

  const groupId = await ensureColocationGroup(l.id, l.user_id, l.title);
  if (!groupId) {
    return { success: false, error: "Impossible de rejoindre cette colocation." };
  }

  // Anti-doublon : déjà membre (quel que soit le statut hors REFUSÉ/PARTI) ?
  const { data: already } = await admin
    .from("roommate_members")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .limit(1);
  const existing = (already as Array<{ id: string; status: string }> | null)?.[0];
  if (existing && ["PENDING", "ACCEPTED", "INVITED"].includes(existing.status)) {
    return {
      success: false,
      error:
        existing.status === "ACCEPTED"
          ? "Vous faites déjà partie de cette colocation."
          : "Votre demande est déjà en attente de validation.",
    };
  }

  if (existing) {
    await admin
      .from("roommate_members")
      .update({ status: "PENDING", left_at: null })
      .eq("id", existing.id);
  } else {
    const { error } = await admin.from("roommate_members").insert({
      group_id: groupId,
      user_id: user.id,
      status: "PENDING",
      is_lead: false,
    });
    if (error) return { success: false, error: error.message };
  }

  // Notifie le principal (best-effort).
  try {
    await admin.from("notifications").insert({
      user_id: l.user_id,
      type: "system",
      title: "Nouvelle demande de colocation",
      body: `${user.firstName} souhaite rejoindre « ${l.title} ». Vérifiez son identité puis validez.`,
      link: `/student/colocations`,
    });
  } catch {
    // non bloquant
  }

  revalidatePath("/student/colocations");
  revalidatePath(`/student-living/${listingId}`);
  return { success: true };
}

/**
 * Le colocataire PRINCIPAL valide (ACCEPTED) ou refuse (REJECTED) un candidat.
 * Seul un membre `is_lead` du groupe concerné peut décider.
 */
export async function decideColocationMember(
  memberId: string,
  decision: "ACCEPTED" | "REJECTED",
): Promise<ActionResult> {
  if (!memberId || (decision !== "ACCEPTED" && decision !== "REJECTED")) {
    return { success: false, error: "Paramètres invalides." };
  }
  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };

  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: member } = await admin
    .from("roommate_members")
    .select("id, group_id, user_id, status")
    .eq("id", memberId)
    .maybeSingle();
  const m = member as
    | { id: string; group_id: string; user_id: string; status: string }
    | null;
  if (!m) return { success: false, error: "Demande introuvable." };

  // L'appelant doit être le PRINCIPAL du groupe.
  const { data: leadRows } = await admin
    .from("roommate_members")
    .select("id")
    .eq("group_id", m.group_id)
    .eq("user_id", user.id)
    .eq("is_lead", true)
    .limit(1);
  if (!((leadRows as Array<{ id: string }> | null)?.[0])) {
    return {
      success: false,
      error: "Seul le colocataire principal peut valider les candidats.",
    };
  }

  if (m.status !== "PENDING") {
    return { success: false, error: "Cette demande a déjà été traitée." };
  }

  const patch =
    decision === "ACCEPTED"
      ? { status: "ACCEPTED", joined_at: new Date().toISOString() }
      : { status: "REJECTED", left_at: new Date().toISOString() };
  const { error } = await admin
    .from("roommate_members")
    .update(patch)
    .eq("id", memberId);
  if (error) return { success: false, error: error.message };

  // Notifie le candidat.
  try {
    await admin.from("notifications").insert({
      user_id: m.user_id,
      type: "system",
      title:
        decision === "ACCEPTED"
          ? "Colocation acceptée 🎉"
          : "Demande de colocation refusée",
      body:
        decision === "ACCEPTED"
          ? "Le colocataire principal a validé votre demande. Bienvenue !"
          : "Votre demande de colocation n'a pas été retenue.",
      link: `/student/colocations`,
    });
  } catch {
    // non bloquant
  }

  revalidatePath("/student/colocations");
  return { success: true };
}
