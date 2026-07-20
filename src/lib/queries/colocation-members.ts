import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// Kaabo — Candidats colocation à valider par le PRINCIPAL
// Pour chaque groupe dont l'utilisateur est `is_lead`, liste les membres en
// statut PENDING avec leur identité (+ statut KYC) pour validation.
// =============================================================================

export interface ColocationCandidate {
  memberId: string;
  groupId: string;
  groupName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string | null;
  verificationStatus: string;
  verified: boolean;
}

export async function listColocationCandidates(
  userId: string,
): Promise<ColocationCandidate[]> {
  if (!userId) return [];
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;

    // 1) Groupes où je suis PRINCIPAL.
    const { data: leadRows } = await admin
      .from("roommate_members")
      .select("group_id")
      .eq("user_id", userId)
      .eq("is_lead", true);
    const groupIds = [
      ...new Set(
        ((leadRows ?? []) as Array<{ group_id: string }>).map(
          (r) => r.group_id,
        ),
      ),
    ];
    if (groupIds.length === 0) return [];

    // 2) Candidats PENDING de ces groupes.
    const { data: pend } = await admin
      .from("roommate_members")
      .select("id, group_id, user_id, status")
      .in("group_id", groupIds)
      .eq("status", "PENDING");
    const pending = (pend ?? []) as Array<{
      id: string;
      group_id: string;
      user_id: string;
      status: string;
    }>;
    if (pending.length === 0) return [];

    // 3) Noms de groupes.
    const { data: groups } = await admin
      .from("roommate_groups")
      .select("id, group_name")
      .in("id", groupIds);
    const groupMap = new Map(
      ((groups ?? []) as Array<{ id: string; group_name: string }>).map((g) => [
        g.id,
        g.group_name,
      ]),
    );

    // 4) Identités des candidats.
    const candidateIds = [...new Set(pending.map((p) => p.user_id))];
    const { data: users } = await admin
      .from("users")
      .select("id, first_name, last_name, email, verification_status")
      .in("id", candidateIds);
    const userMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        verification_status: string | null;
      }>).map((u) => [u.id, u]),
    );

    return pending.map((p) => {
      const u = userMap.get(p.user_id);
      const name =
        `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "Candidat";
      const vs = u?.verification_status ?? "UNVERIFIED";
      return {
        memberId: p.id,
        groupId: p.group_id,
        groupName: groupMap.get(p.group_id) ?? "Colocation",
        candidateId: p.user_id,
        candidateName: name,
        candidateEmail: u?.email ?? null,
        verificationStatus: vs,
        verified: vs === "APPROVED",
      };
    });
  } catch (err) {
    console.error("[colocation-members] listColocationCandidates:", err);
    return [];
  }
}
