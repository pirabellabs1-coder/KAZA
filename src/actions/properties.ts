"use server";

// =============================================================================
// Kaabo - Properties (Server Actions)
//
// Convention de retour : `{ success: true; data?: T } | { success: false; error }`.
// Toutes les mutations valident l'entree avec Zod, recuperent le user via
// `createClient()` (Supabase SSR), verifient l'ownership puis revalident
// `/owner/properties`.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { track } from "@/lib/analytics/track";
import { awardPoints } from "@/lib/points/award";
import { getActiveSubscription } from "@/lib/queries/subscriptions";
import { getPlanQuotas } from "@/lib/subscriptions/quotas";
import type { Property } from "@/types/properties";
import {
  createPropertySchema,
  updatePropertySchema,
  type CreatePropertyFormData,
  type UpdatePropertyFormData,
} from "@/validators/property";

import type { ActionResult } from "./notifications";

// TODO: type manquant - `Database` (src/types/supabase.ts) ne declare pas
// `Relationships: []` sur chaque table, ce qui fait collapser Insert/Update
// vers `never` avec postgrest-js v2.99. Tant que Yaw n'a pas regenere les
// types via la Supabase CLI, on utilise un client "loose-typed" pour les
// mutations. Les lectures sont typees a l'arrivee via des casts cibles.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/**
 * Convertit lat/lng en WKT POINT EPSG:4326 attendu par PostGIS.
 * Retourne `null` si les coordonnees sont incompletes.
 */
function toGeographyPoint(
  lat?: number,
  lng?: number
): string | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Verifie que l'utilisateur courant est bien le proprietaire de l'annonce.
 * Retourne le couple `{ user, property }` si OK, sinon un `ActionResult` d'erreur.
 */
async function assertOwnership(propertyId: string) {
  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      result: { success: false as const, error: "Vous devez etre connecte." },
    };
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, owner_id, status")
    .eq("id", propertyId)
    .maybeSingle();

  if (error || !property) {
    return {
      ok: false as const,
      result: { success: false as const, error: "Annonce introuvable." },
    };
  }

  if (property.owner_id !== user.id) {
    return {
      ok: false as const,
      result: {
        success: false as const,
        error: "Vous n'etes pas autorise a modifier cette annonce.",
      },
    };
  }

  return { ok: true as const, supabase, user, property };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Cree une nouvelle annonce immobiliere en statut DRAFT.
 * Le proprietaire doit etre authentifie et avoir le role OWNER.
 */
export async function createProperty(
  formData: CreatePropertyFormData
): Promise<ActionResult<Property>> {
  const parsed = createPropertySchema.safeParse(formData);
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

  // -------------------------------------------------------------------------
  // Enforcement du quota d'annonces actives selon l'abonnement.
  // Fail-open : en cas d'erreur de lecture, on n'empêche PAS la création
  // (mieux vaut laisser passer qu'imputer à tort un quota à un client payant).
  // -------------------------------------------------------------------------
  try {
    const sub = await getActiveSubscription(user.id);
    const quotas = getPlanQuotas(sub?.plan ?? null);
    if (Number.isFinite(quotas.maxListings)) {
      const { count } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .neq("status", "ARCHIVED");
      if ((count ?? 0) >= quotas.maxListings) {
        return {
          success: false,
          error: `Quota d'annonces atteint (${quotas.maxListings} sur le plan ${quotas.label}). Passez à un plan supérieur pour publier davantage d'annonces.`,
        };
      }
    }
  } catch {
    // Ignore — on laisse la création se poursuivre (fail-open).
  }

  // Statut initial selon le réglage de modération (platform_settings.moderation).
  // - Si auto-approbation activée ET propriétaire vérifié → AVAILABLE direct.
  // - Sinon → PENDING_REVIEW (passe par la modération admin).
  let initialStatus: "AVAILABLE" | "PENDING_REVIEW" = "AVAILABLE";
  try {
    const [modRes, ownerRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("platform_settings")
        .select("value")
        .eq("key", "moderation")
        .maybeSingle(),
      supabase.from("users").select("is_verified").eq("id", user.id).maybeSingle(),
    ]);
    const autoApprove = Boolean(
      (modRes.data?.value as { autoApprove?: boolean } | null)?.autoApprove,
    );
    const isVerified = Boolean(ownerRes.data?.is_verified);
    // Auto-approbation = publication directe seulement si proprio vérifié.
    // Si l'auto-approbation est désactivée, toute annonce passe en modération.
    initialStatus = autoApprove && isVerified ? "AVAILABLE" : "PENDING_REVIEW";
  } catch {
    // En cas d'échec de lecture du réglage, on modère par défaut (prudent).
    initialStatus = "PENDING_REVIEW";
  }

  const payload = {
    owner_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    listing_type: parsed.data.listingType,
    price: parsed.data.price,
    bedrooms: parsed.data.bedrooms,
    bathrooms: parsed.data.bathrooms,
    square_meters: parsed.data.squareMeters,
    property_type: parsed.data.propertyType,
    address: parsed.data.address,
    amenities: parsed.data.amenities,
    panorama_scenes: parsed.data.panorama360Scenes ?? [],
    // Compat : 1ʳᵉ scène (ou URL simple) comme panorama principal.
    panorama_url:
      parsed.data.panorama360Scenes?.[0]?.url ||
      parsed.data.panorama360Url ||
      null,
    location: toGeographyPoint(
      parsed.data.locationLatitude,
      parsed.data.locationLongitude
    ),
    status: initialStatus,
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Impossible de creer l'annonce.",
    };
  }

  // Tracking analytics — best-effort, ne bloque pas la création.
  await track({
    eventType: "PROPERTY_PUBLISHED",
    metadata: { property_id: data.id },
  });

  // Points Kaabo : annonce publiée (+250).
  await awardPoints(
    user.id,
    "PROPERTY_LISTED",
    `Annonce publiée — ${parsed.data.title ?? "bien"}`,
    250,
    { property_id: data.id },
  );

  revalidatePath("/owner/properties");
  // TODO: type manquant - `Property` (src/types/properties.ts) n'inclut pas
  // tous les statuts/types de la DB. On cast pour rester pragmatique.
  return { success: true, data: data as unknown as Property };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Met a jour une annonce existante. Seuls les champs presents dans `formData`
 * sont modifies. L'appelant doit etre proprietaire de l'annonce.
 */
export async function updateProperty(
  id: string,
  formData: Partial<UpdatePropertyFormData>
): Promise<ActionResult<Property>> {
  const parsed = updatePropertySchema.safeParse({ ...formData, id });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Donnees invalides.",
    };
  }

  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- on retire `id` pour ne garder que les champs à mettre à jour dans `rest`
  const { id: _id, ...rest } = parsed.data;

  const update: Record<string, unknown> = {};
  if (rest.title !== undefined) update.title = rest.title;
  if (rest.description !== undefined) update.description = rest.description;
  if (rest.listingType !== undefined) update.listing_type = rest.listingType;
  if (rest.price !== undefined) update.price = rest.price;
  if (rest.bedrooms !== undefined) update.bedrooms = rest.bedrooms;
  if (rest.bathrooms !== undefined) update.bathrooms = rest.bathrooms;
  if (rest.squareMeters !== undefined) update.square_meters = rest.squareMeters;
  if (rest.propertyType !== undefined) update.property_type = rest.propertyType;
  if (rest.address !== undefined) update.address = rest.address;
  if (rest.amenities !== undefined) update.amenities = rest.amenities;
  if (rest.locationLatitude !== undefined || rest.locationLongitude !== undefined) {
    update.location = toGeographyPoint(
      rest.locationLatitude,
      rest.locationLongitude
    );
  }

  const { data, error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Impossible de mettre a jour l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath(`/properties/${id}`);
  return { success: true, data: data as unknown as Property };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Supprime definitivement une annonce (cascade SQL sur photos, favoris, etc.). */
export async function deleteProperty(id: string): Promise<ActionResult> {
  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { error } = await supabase.from("properties").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Impossible de supprimer l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Publish / Unpublish
// ---------------------------------------------------------------------------

/**
 * Publie une annonce (statut -> AVAILABLE). L'annonce devient visible
 * dans la recherche publique.
 */
export async function publishProperty(id: string): Promise<ActionResult<Property>> {
  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { data, error } = await supabase
    .from("properties")
    .update({ status: "AVAILABLE" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Impossible de publier l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath("/properties");
  return { success: true, data: data as unknown as Property };
}

/** Retire une annonce de la recherche publique (statut -> UNAVAILABLE). */
export async function unpublishProperty(id: string): Promise<ActionResult<Property>> {
  const check = await assertOwnership(id);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { data, error } = await supabase
    .from("properties")
    .update({ status: "UNAVAILABLE" })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Impossible de retirer l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath("/properties");
  return { success: true, data: data as unknown as Property };
}

// ---------------------------------------------------------------------------
// Edition complète depuis le dashboard owner (page /owner/properties/[id]/edit)
// ---------------------------------------------------------------------------

/** Statuts utilisables par l'owner depuis son dashboard. */
export type OwnerPropertyStatus =
  | "DRAFT"
  | "AVAILABLE"
  | "RENTED"
  | "UNAVAILABLE"
  | "ARCHIVED";

const OWNER_STATUSES: readonly OwnerPropertyStatus[] = [
  "DRAFT",
  "AVAILABLE",
  "RENTED",
  "UNAVAILABLE",
  "ARCHIVED",
] as const;

export interface UpdatePropertyFullInput {
  id: string;
  title?: string;
  description?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareMeters?: number;
  address?: string;
  amenities?: string[];
  status?: OwnerPropertyStatus;
}

/**
 * Met à jour tous les champs éditables d'une annonce depuis le formulaire
 * d'édition owner. Variante "loose" du `updateProperty` legacy : pas de
 * validation Zod stricte (les bornes sont validées côté UI), accepte le
 * changement de statut et applique uniquement les champs définis.
 */
export async function updatePropertyFull(
  input: UpdatePropertyFullInput,
): Promise<ActionResult<Property>> {
  if (!input.id) {
    return { success: false, error: "Identifiant manquant." };
  }

  // Garde-fous légers — l'UI valide déjà, mais on protège la DB.
  if (input.title !== undefined && input.title.trim().length < 5) {
    return { success: false, error: "Le titre doit contenir au moins 5 caractères." };
  }
  if (
    input.description !== undefined &&
    input.description.trim().length < 20
  ) {
    return {
      success: false,
      error: "La description doit contenir au moins 20 caractères.",
    };
  }
  if (input.price !== undefined && input.price <= 0) {
    return { success: false, error: "Le loyer doit être supérieur à 0." };
  }
  if (
    input.status !== undefined &&
    !OWNER_STATUSES.includes(input.status)
  ) {
    return { success: false, error: "Statut invalide." };
  }

  const check = await assertOwnership(input.id);
  if (!check.ok) return check.result;

  const { supabase } = check;

  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title.trim();
  if (input.description !== undefined)
    update.description = input.description.trim();
  if (input.price !== undefined) update.price = input.price;
  if (input.bedrooms !== undefined) update.bedrooms = input.bedrooms;
  if (input.bathrooms !== undefined) update.bathrooms = input.bathrooms;
  if (input.squareMeters !== undefined)
    update.square_meters = input.squareMeters;
  if (input.address !== undefined) update.address = input.address.trim();
  if (input.amenities !== undefined) update.amenities = input.amenities;
  if (input.status !== undefined) update.status = input.status;

  if (Object.keys(update).length === 0) {
    return { success: false, error: "Aucune modification à enregistrer." };
  }

  const { data, error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", input.id)
    .eq("owner_id", check.user.id) // double-check côté requête
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Impossible de mettre à jour l'annonce.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath(`/owner/properties/${input.id}`);
  revalidatePath(`/owner/properties/${input.id}/edit`);
  revalidatePath(`/properties/${input.id}`);
  revalidatePath("/properties");

  return { success: true, data: data as unknown as Property };
}

/**
 * Bascule rapide du statut d'une annonce — utilisée par le menu contextuel
 * "..." de la liste des biens (mettre hors marché / republier / archiver).
 */
export async function setPropertyStatus(
  propertyId: string,
  status: OwnerPropertyStatus,
): Promise<ActionResult<Property>> {
  if (!propertyId) {
    return { success: false, error: "Identifiant manquant." };
  }
  if (!OWNER_STATUSES.includes(status)) {
    return { success: false, error: "Statut invalide." };
  }

  const check = await assertOwnership(propertyId);
  if (!check.ok) return check.result;

  const { supabase } = check;
  const { data, error } = await supabase
    .from("properties")
    .update({ status })
    .eq("id", propertyId)
    .eq("owner_id", check.user.id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Impossible de changer le statut.",
    };
  }

  revalidatePath("/owner/properties");
  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties");

  return { success: true, data: data as unknown as Property };
}
