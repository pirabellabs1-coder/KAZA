"use server";

// =============================================================================
// KAZA — Server Actions équipe agence
// L'agence courante (auth.uid()) est le owner du tenant agency_members. Les
// invitations sont stockées en INVITED + invited_email ; le rattachement
// member_id se fait via `acceptInvitation()` au signup.
// =============================================================================

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "./notifications";
import type { AgencyRole, AgencyMemberStatus } from "@/lib/queries/agency-team";

// TODO: types Supabase non régénérés pour les nouvelles tables.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

const ROLES = [
  "DIRECTOR",
  "MANAGER",
  "AGENT_SENIOR",
  "AGENT",
  "INTERN",
  "ACCOUNTANT",
] as const;

const inviteSchema = z.object({
  email: z.string().email("Email invalide."),
  fullName: z.string().min(2, "Nom complet requis."),
  role: z.enum(ROLES),
  phone: z.string().optional(),
});

export type InviteMemberInput = z.infer<typeof inviteSchema>;

async function requireAuth() {
  const supabase = await getLooseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false as const,
      result: { success: false as const, error: "Vous devez être connecté." },
    };
  }
  return { ok: true as const, supabase, user };
}

/**
 * Invite un nouveau membre dans l'équipe (statut INVITED).
 * L'agency_id est l'id de l'utilisateur courant (rôle AGENCY).
 */
export async function inviteMember(
  input: InviteMemberInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase, user } = auth;

  // Si un user existe déjà avec cet email, on tente de pré-lier member_id.
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();

  const memberId = (existingUser as { id?: string } | null)?.id ?? null;

  const { data: inserted, error: insertError } = await supabase
    .from("agency_members")
    .insert({
      agency_id: user.id,
      member_id: memberId,
      invited_email: parsed.data.email,
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      status: memberId ? "ACTIVE" : "INVITED",
      phone: parsed.data.phone ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[agency-team] inviteMember:", insertError?.message);
    return {
      success: false,
      error: "Impossible d'inviter ce membre.",
    };
  }

  revalidatePath("/agency/team");
  return {
    success: true,
    data: { id: (inserted as { id: string }).id },
  };
}

/** Modifie le rôle d'un membre. RLS contrôle que c'est bien l'agence owner. */
export async function updateMemberRole(
  memberId: string,
  newRole: AgencyRole,
): Promise<ActionResult> {
  if (!ROLES.includes(newRole)) {
    return { success: false, error: "Rôle inconnu." };
  }
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase
    .from("agency_members")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    console.error("[agency-team] updateMemberRole:", error.message);
    return {
      success: false,
      error: "Impossible de modifier le rôle.",
    };
  }

  revalidatePath("/agency/team");
  return { success: true };
}

/** Soft-remove : status = REMOVED (la ligne reste pour l'historique). */
export async function removeMember(
  memberId: string,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase
    .from("agency_members")
    .update({
      status: "REMOVED" satisfies AgencyMemberStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    console.error("[agency-team] removeMember:", error.message);
    return {
      success: false,
      error: "Impossible de retirer ce membre.",
    };
  }

  revalidatePath("/agency/team");
  return { success: true };
}

/**
 * Met à jour le statut (ACTIVE / ON_LEAVE) d'un membre.
 * Bonus utilitaire pour la page équipe.
 */
export async function updateMemberStatus(
  memberId: string,
  newStatus: Extract<AgencyMemberStatus, "ACTIVE" | "ON_LEAVE">,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase } = auth;

  const { error } = await supabase
    .from("agency_members")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    console.error("[agency-team] updateMemberStatus:", error.message);
    return { success: false, error: "Impossible de modifier le statut." };
  }
  revalidatePath("/agency/team");
  return { success: true };
}

/**
 * Lie l'utilisateur courant à toutes les invitations INVITED matchant
 * son email. Appelée après inscription pour activer l'appartenance équipe.
 */
export async function acceptInvitation(): Promise<ActionResult<{ linked: number }>> {
  const auth = await requireAuth();
  if (!auth.ok) return auth.result;
  const { supabase, user } = auth;
  if (!user.email) {
    return { success: false, error: "Email manquant sur le compte." };
  }

  const { data: invitations, error: fetchError } = await supabase
    .from("agency_members")
    .select("id")
    .eq("invited_email", user.email)
    .eq("status", "INVITED");

  if (fetchError) {
    console.error("[agency-team] acceptInvitation fetch:", fetchError.message);
    return { success: false, error: "Impossible de vérifier les invitations." };
  }

  const rows = (invitations ?? []) as Array<{ id: string }>;
  if (rows.length === 0) {
    return { success: true, data: { linked: 0 } };
  }

  const { error: updateError } = await supabase
    .from("agency_members")
    .update({
      member_id: user.id,
      status: "ACTIVE",
      updated_at: new Date().toISOString(),
    })
    .in(
      "id",
      rows.map((r) => r.id),
    );

  if (updateError) {
    console.error(
      "[agency-team] acceptInvitation update:",
      updateError.message,
    );
    return { success: false, error: "Impossible d'accepter l'invitation." };
  }

  revalidatePath("/agency/team");
  return { success: true, data: { linked: rows.length } };
}
