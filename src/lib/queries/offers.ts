import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA — Offres d'achat (lectures)
// =============================================================================

export interface OfferItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  deposit: number;
  status: string;
  message: string | null;
  counterpartyName: string;
  createdAt: string;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "—";
}

/** Offres reçues par le VENDEUR sur ses biens. */
export async function listOffersForSeller(userId: string): Promise<OfferItem[]> {
  if (!userId) return [];
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data } = await supabase
    .from("property_offers")
    .select(
      `id, property_id, amount_fcfa, deposit_fcfa, status, message, created_at,
       buyer:users!buyer_id(first_name, last_name),
       property:properties!property_id(title, address, owner_id)`,
    )
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return rows
    .filter((r) => r.property?.owner_id === userId)
    .map((r) => ({
      id: r.id as string,
      propertyId: r.property_id as string,
      propertyTitle: (r.property?.title as string) ?? "Bien",
      propertyAddress: (r.property?.address as string) ?? "",
      amount: Number(r.amount_fcfa ?? 0),
      deposit: Number(r.deposit_fcfa ?? 0),
      status: r.status as string,
      message: (r.message as string | null) ?? null,
      counterpartyName: fullName(r.buyer?.first_name, r.buyer?.last_name),
      createdAt: r.created_at as string,
    }));
}

/** Offres faites par l'ACHETEUR. */
export async function listOffersForBuyer(userId: string): Promise<OfferItem[]> {
  if (!userId) return [];
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data } = await supabase
    .from("property_offers")
    .select(
      `id, property_id, amount_fcfa, deposit_fcfa, status, message, created_at,
       property:properties!property_id(title, address, owner:users!owner_id(first_name, last_name))`,
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    id: r.id as string,
    propertyId: r.property_id as string,
    propertyTitle: (r.property?.title as string) ?? "Bien",
    propertyAddress: (r.property?.address as string) ?? "",
    amount: Number(r.amount_fcfa ?? 0),
    deposit: Number(r.deposit_fcfa ?? 0),
    status: r.status as string,
    message: (r.message as string | null) ?? null,
    counterpartyName: fullName(
      r.property?.owner?.first_name,
      r.property?.owner?.last_name,
    ),
    createdAt: r.created_at as string,
  }));
}

/**
 * Nombre d'offres d'achat EN ATTENTE (PENDING) sur les biens du vendeur.
 * Sert d'alerte sur le dashboard propriétaire/agence.
 */
export async function countPendingOffersForSeller(
  userId: string,
): Promise<number> {
  if (!userId) return 0;
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data: props } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", userId);
  const propIds = ((props ?? []) as Array<{ id: string }>).map((p) => p.id);
  if (propIds.length === 0) return 0;

  const { count } = await supabase
    .from("property_offers")
    .select("id", { count: "exact", head: true })
    .in("property_id", propIds)
    .eq("status", "PENDING");
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Admin — toutes les offres + stats (supervision)
// ---------------------------------------------------------------------------

export interface AdminOfferItem extends OfferItem {
  buyerName: string;
  sellerName: string;
}

export interface AdminOffersData {
  offers: AdminOfferItem[];
  stats: {
    total: number;
    pending: number;
    accepted: number;
    reserved: number; // DEPOSIT_PAID
    closed: number; // vendus
    depositVolume: number; // somme des acomptes versés (DEPOSIT_PAID/CLOSED)
    salesVolume: number; // somme des montants des ventes conclues (CLOSED)
  };
}

/** Toutes les offres de la plateforme (admin) + statistiques agrégées. */
export async function listAllOffersAdmin(): Promise<AdminOffersData> {
  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data } = await admin
    .from("property_offers")
    .select(
      `id, property_id, amount_fcfa, deposit_fcfa, status, message, created_at,
       buyer:users!buyer_id(first_name, last_name),
       property:properties!property_id(title, address, owner:users!owner_id(first_name, last_name))`,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  const offers: AdminOfferItem[] = rows.map((r) => ({
    id: r.id as string,
    propertyId: r.property_id as string,
    propertyTitle: (r.property?.title as string) ?? "Bien",
    propertyAddress: (r.property?.address as string) ?? "",
    amount: Number(r.amount_fcfa ?? 0),
    deposit: Number(r.deposit_fcfa ?? 0),
    status: r.status as string,
    message: (r.message as string | null) ?? null,
    counterpartyName: "",
    buyerName: fullName(r.buyer?.first_name, r.buyer?.last_name),
    sellerName: fullName(
      r.property?.owner?.first_name,
      r.property?.owner?.last_name,
    ),
    createdAt: r.created_at as string,
  }));

  const stats = {
    total: offers.length,
    pending: offers.filter((o) => o.status === "PENDING").length,
    accepted: offers.filter((o) => o.status === "ACCEPTED").length,
    reserved: offers.filter((o) => o.status === "DEPOSIT_PAID").length,
    closed: offers.filter((o) => o.status === "CLOSED").length,
    depositVolume: offers
      .filter((o) => o.status === "DEPOSIT_PAID" || o.status === "CLOSED")
      .reduce((s, o) => s + o.deposit, 0),
    salesVolume: offers
      .filter((o) => o.status === "CLOSED")
      .reduce((s, o) => s + o.amount, 0),
  };

  return { offers, stats };
}
