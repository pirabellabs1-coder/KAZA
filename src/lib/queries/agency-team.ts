import "server-only";

// =============================================================================
// Kaabo — Queries équipe agence (server-side)
// Lit `agency_members` filtré par agency_id (= user_id de l'agence) et joint
// `users` pour enrichir email/avatar quand le membre a accepté l'invitation.
// =============================================================================

import { createClient } from "@/lib/supabase/server";

export type AgencyRole =
  | "DIRECTOR"
  | "MANAGER"
  | "AGENT_SENIOR"
  | "AGENT"
  | "INTERN"
  | "ACCOUNTANT";

export type AgencyMemberStatus = "ACTIVE" | "ON_LEAVE" | "INVITED" | "REMOVED";

export interface AgencyTeamMember {
  id: string;
  agencyId: string;
  memberId: string | null;
  invitedEmail: string | null;
  fullName: string;
  role: AgencyRole;
  status: AgencyMemberStatus;
  phone: string | null;
  permissions: string[];
  hiredAt: string | null;
  createdAt: string;
  // Enrichi via join users (si memberId)
  email: string | null;
  avatarUrl: string | null;
}

export interface AgencyTeamStats {
  total: number;
  active: number;
  onLeave: number;
  invited: number;
}

/**
 * Liste les membres d'une agence (hors REMOVED) avec join sur users
 * pour récupérer email/avatar quand member_id est non null.
 */
export async function listTeamMembers(
  agencyId: string,
): Promise<AgencyTeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, v: string) => {
          neq: (col: string, v: string) => {
            order: (
              col: string,
              opts: { ascending: boolean },
            ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
          };
        };
      };
    };
  })
    .from("agency_members")
    .select(
      `
      id, agency_id, member_id, invited_email, full_name, role, status,
      phone, permissions, hired_at, created_at,
      user:users!agency_members_member_id_fkey(email, avatar_url)
    `,
    )
    .eq("agency_id", agencyId)
    .neq("status", "REMOVED")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[agency-team] listTeamMembers:", error.message);
    return [];
  }

  return (data ?? []).map((raw): AgencyTeamMember => {
    const row = raw as {
      id: string;
      agency_id: string;
      member_id: string | null;
      invited_email: string | null;
      full_name: string;
      role: AgencyRole;
      status: AgencyMemberStatus;
      phone: string | null;
      permissions: string[] | null;
      hired_at: string | null;
      created_at: string;
      user?: { email: string | null; avatar_url: string | null } | null;
    };
    return {
      id: row.id,
      agencyId: row.agency_id,
      memberId: row.member_id,
      invitedEmail: row.invited_email,
      fullName: row.full_name,
      role: row.role,
      status: row.status,
      phone: row.phone,
      permissions: row.permissions ?? [],
      hiredAt: row.hired_at,
      createdAt: row.created_at,
      email: row.user?.email ?? row.invited_email,
      avatarUrl: row.user?.avatar_url ?? null,
    };
  });
}

/**
 * Counts par statut pour l'agence.
 */
export async function getTeamStats(
  agencyId: string,
): Promise<AgencyTeamStats> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (
          col: string,
          v: string,
        ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  })
    .from("agency_members")
    .select("status")
    .eq("agency_id", agencyId);

  if (error || !data) {
    console.error("[agency-team] getTeamStats:", error?.message);
    return { total: 0, active: 0, onLeave: 0, invited: 0 };
  }

  const rows = data as Array<{ status: AgencyMemberStatus }>;
  const filtered = rows.filter((r) => r.status !== "REMOVED");

  return {
    total: filtered.length,
    active: filtered.filter((r) => r.status === "ACTIVE").length,
    onLeave: filtered.filter((r) => r.status === "ON_LEAVE").length,
    invited: filtered.filter((r) => r.status === "INVITED").length,
  };
}

/** Retourne un membre par id (utilitaire pour les détails). */
export async function getTeamMember(
  memberId: string,
): Promise<AgencyTeamMember | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (
          col: string,
          v: string,
        ) => {
          maybeSingle: () => Promise<{
            data: unknown | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("agency_members")
    .select(
      `
      id, agency_id, member_id, invited_email, full_name, role, status,
      phone, permissions, hired_at, created_at,
      user:users!agency_members_member_id_fkey(email, avatar_url)
    `,
    )
    .eq("id", memberId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as {
    id: string;
    agency_id: string;
    member_id: string | null;
    invited_email: string | null;
    full_name: string;
    role: AgencyRole;
    status: AgencyMemberStatus;
    phone: string | null;
    permissions: string[] | null;
    hired_at: string | null;
    created_at: string;
    user?: { email: string | null; avatar_url: string | null } | null;
  };
  return {
    id: row.id,
    agencyId: row.agency_id,
    memberId: row.member_id,
    invitedEmail: row.invited_email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    phone: row.phone,
    permissions: row.permissions ?? [],
    hiredAt: row.hired_at,
    createdAt: row.created_at,
    email: row.user?.email ?? row.invited_email,
    avatarUrl: row.user?.avatar_url ?? null,
  };
}
