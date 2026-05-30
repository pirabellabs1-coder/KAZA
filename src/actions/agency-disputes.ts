"use server";

import "server-only";

// =============================================================================
// KAZA — Server actions Litiges agence (table disputes, migration 00037)
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

const disputeSchema = z.object({
  title: z.string().trim().min(3, "Titre requis").max(160),
  description: z.string().trim().max(2000).optional().default(""),
  disputeType: z.enum([
    "UNPAID_RENT",
    "DAMAGE",
    "COMPLAINT",
    "NOISE",
    "BREACH",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  tenantId: z.string().uuid().optional().or(z.literal("")).default(""),
  rentalId: z.string().uuid().optional().or(z.literal("")).default(""),
  propertyId: z.string().uuid().optional().or(z.literal("")).default(""),
  amountFcfa: z.number().nonnegative().optional(),
});

export type DisputeInput = z.infer<typeof disputeSchema>;

async function requireAgency() {
  const user = await getCurrentDisplayUser();
  if (!user) return { ok: false as const, error: "Vous devez être connecté." };
  if (user.role !== "AGENCY")
    return { ok: false as const, error: "Action réservée aux agences." };
  return { ok: true as const, userId: user.id };
}

export async function createDispute(input: DisputeInput): Promise<ActionResult> {
  const parsed = disputeSchema.safeParse(input);
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
    .from("disputes")
    .insert({
      agency_id: guard.userId,
      title: d.title,
      description: d.description || null,
      dispute_type: d.disputeType,
      priority: d.priority,
      tenant_id: d.tenantId || null,
      rental_id: d.rentalId || null,
      property_id: d.propertyId || null,
      amount_fcfa: d.amountFcfa ?? null,
      status: "OPEN",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/agency/disputes");
  return { success: true, id: data?.id };
}

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export async function updateDisputeStatus(
  id: string,
  status: (typeof STATUSES)[number],
  resolution?: string,
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
  if (resolution !== undefined) patch.resolution = resolution.trim() || null;
  if (status === "RESOLVED" || status === "CLOSED") {
    patch.resolved_at = new Date().toISOString();
  }

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
    .from("disputes")
    .update(patch)
    .eq("id", id)
    .eq("agency_id", guard.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/agency/disputes");
  return { success: true };
}
