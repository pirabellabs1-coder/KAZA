import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

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
