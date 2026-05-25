"use server";

// =============================================================================
// KAZA - Reviews / Ratings (Server Actions)
//
// Un utilisateur peut noter une autre partie a l'issue d'une location
// (rental). Contrainte applicative : 1 review par (rater_id, rental_id).
// La contrainte d'unicite n'est PAS encore au niveau SQL (cf. rapport).
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Rating } from "@/types/properties";

import { createNotification, type ActionResult } from "./notifications";

// TODO: type manquant - voir note dans `properties.ts`.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const createReviewSchema = z.object({
  targetUserId: z.string().uuid("Utilisateur cible invalide."),
  rentalId: z.string().uuid("Location invalide."),
  rating: z
    .number()
    .int("La note doit etre un entier.")
    .min(1, "La note minimale est 1.")
    .max(5, "La note maximale est 5."),
  comment: z
    .string()
    .max(2000, "Le commentaire ne peut pas depasser 2000 caracteres.")
    .optional(),
});

interface CreateReviewInput {
  targetUserId: string;
  rentalId: string;
  rating: number;
  comment?: string;
}

// ---------------------------------------------------------------------------
// createReview
// ---------------------------------------------------------------------------

/**
 * Cree un avis sur un utilisateur pour une location donnee.
 * Refuse les doublons et l'auto-evaluation. Verifie que l'auteur est bien
 * partie prenante de la location (locataire ou proprietaire).
 */
export async function createReview(
  input: CreateReviewInput
): Promise<ActionResult<Rating>> {
  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  if (user.id === parsed.data.targetUserId) {
    return {
      success: false,
      error: "Vous ne pouvez pas vous evaluer vous-meme.",
    };
  }

  const { data: rental, error: rentalError } = await supabase
    .from("rentals")
    .select("id, tenant_id, property_id, properties!inner(owner_id)")
    .eq("id", parsed.data.rentalId)
    .maybeSingle();

  if (rentalError || !rental) {
    return { success: false, error: "Location introuvable." };
  }

  const ownerId = (rental as unknown as { properties: { owner_id: string } })
    .properties.owner_id;

  const isParticipant = rental.tenant_id === user.id || ownerId === user.id;
  if (!isParticipant) {
    return {
      success: false,
      error: "Vous n'etes pas partie prenante de cette location.",
    };
  }

  const targetIsParticipant =
    rental.tenant_id === parsed.data.targetUserId ||
    ownerId === parsed.data.targetUserId;
  if (!targetIsParticipant) {
    return {
      success: false,
      error: "L'utilisateur cible n'est pas lie a cette location.",
    };
  }

  // Garde-fou applicatif : empeche les doublons (1 review par rater/rental).
  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("rater_id", user.id)
    .eq("rental_id", parsed.data.rentalId)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: "Vous avez deja laisse un avis pour cette location.",
    };
  }

  const insert = {
    rater_id: user.id,
    rated_user_id: parsed.data.targetUserId,
    rental_id: parsed.data.rentalId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  };

  const { data, error } = await supabase
    .from("ratings")
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Impossible d'enregistrer votre avis.",
    };
  }

  await createNotification(supabase, {
    userId: parsed.data.targetUserId,
    type: "REVIEW_RECEIVED",
    title: "Nouvel avis recu",
    body: `Vous avez recu une note de ${parsed.data.rating}/5.`,
    link: `/profile`,
  });

  revalidatePath(`/profile/${parsed.data.targetUserId}`);
  return { success: true, data: data as unknown as Rating };
}

// ---------------------------------------------------------------------------
// deleteReview
// ---------------------------------------------------------------------------

/** Supprime un avis. Seul l'auteur peut le supprimer. */
export async function deleteReview(id: string): Promise<ActionResult> {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  const { data: review, error: fetchError } = await supabase
    .from("ratings")
    .select("id, rater_id, rated_user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !review) {
    return { success: false, error: "Avis introuvable." };
  }

  if (review.rater_id !== user.id) {
    return {
      success: false,
      error: "Vous n'etes pas autorise a supprimer cet avis.",
    };
  }

  const { error } = await supabase.from("ratings").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Impossible de supprimer l'avis." };
  }

  revalidatePath(`/profile/${review.rated_user_id}`);
  return { success: true };
}
