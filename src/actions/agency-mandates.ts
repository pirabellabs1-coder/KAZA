"use server";

import "server-only";

// =============================================================================
// KAZA — Server actions Mandats d'agence (table agency_mandates, migration 00037)
// Réservé au rôle AGENCY. RLS : agency_id = auth.uid().
// =============================================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

const mandateSchema = z.object({
  ownerName: z.string().trim().min(2, "Nom du mandant requis").max(160),
  ownerEmail: z
    .string()
    .trim()
    .max(255)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email invalide.",
    })
    .optional()
    .default(""),
  ownerPhone: z.string().trim().max(40).optional().default(""),
  propertyId: z.string().uuid().optional().or(z.literal("")).default(""),
  mandateType: z.enum(["GESTION", "LOCATION", "VENTE", "EXCLUSIF"]),
  commissionRate: z
    .number()
    .min(0, "Taux ≥ 0")
    .max(100, "Taux ≤ 100"),
  isExclusive: z.boolean().default(false),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type MandateInput = z.infer<typeof mandateSchema>;

async function requireAgency() {
  const user = await getCurrentDisplayUser();
  if (!user) return { ok: false as const, error: "Vous devez être connecté." };
  if (user.role !== "AGENCY")
    return { ok: false as const, error: "Action réservée aux agences." };
  return { ok: true as const, userId: user.id };
}

export async function createMandate(input: MandateInput): Promise<ActionResult> {
  const parsed = mandateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }
  const guard = await requireAgency();
  if (!guard.ok) return { success: false, error: guard.error };

  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await (
    supabase as unknown as {
      from: (t: string) => {
        insert: (v: Record<string, unknown>) => {
          select: (c: string) => {
            single: () => Promise<{
              data: { id: string } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .from("agency_mandates")
    .insert({
      agency_id: guard.userId,
      owner_name: d.ownerName,
      owner_email: d.ownerEmail || null,
      owner_phone: d.ownerPhone || null,
      property_id: d.propertyId || null,
      mandate_type: d.mandateType,
      commission_rate: d.commissionRate,
      is_exclusive: d.isExclusive,
      start_date: d.startDate || null,
      end_date: d.endDate || null,
      notes: d.notes || null,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/agency/mandates");
  revalidatePath("/agency/commissions");
  return { success: true, id: data?.id };
}

const STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "TERMINATED",
  "EXPIRED",
] as const;

export async function setMandateStatus(
  id: string,
  status: (typeof STATUSES)[number],
): Promise<ActionResult> {
  if (!id || !STATUSES.includes(status)) {
    return { success: false, error: "Paramètres invalides." };
  }
  const guard = await requireAgency();
  if (!guard.ok) return { success: false, error: guard.error };

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  // Passage à ACTIF = signature du mandat (horodatée).
  if (status === "ACTIVE") patch.signed_at = new Date().toISOString();

  const { error } = await (
    supabase as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => {
          eq: (c: string, val: string) => {
            eq: (c2: string, val2: string) => Promise<{
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .from("agency_mandates")
    .update(patch)
    .eq("id", id)
    .eq("agency_id", guard.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/agency/mandates");
  revalidatePath(`/agency/mandates/${id}`);
  revalidatePath("/agency/commissions");
  return { success: true };
}
