import "server-only";

// =============================================================================
// KAZA - Queries Referrals (server-side)
//
// Tables ciblees :
//   - public.referral_codes(user_id PK, code unique)
//   - public.referrals(id, referrer_id, referred_id, code, status,
//                      points_awarded, completed_at, created_at)
// =============================================================================

import { createClient } from "@/lib/supabase/server";

export type ReferralStatus = "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export interface ReferralStats {
  code: string | null;
  totalInvited: number;
  totalConverted: number;
  pointsEarned: number;
}

export interface ReferralEntry {
  id: string;
  status: ReferralStatus | string;
  points: number;
  completedAt: string | null;
  createdAt: string;
  referredName: string;
  referredEmail: string | null;
}

/**
 * Retourne les stats consolidees du programme de parrainage pour un user.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const supabase = await createClient();
  const [codeRes, refsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any)("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any)("referrals")
      .select("id, status, points_awarded")
      .eq("referrer_id", userId),
  ]);

  const code = (codeRes.data as { code?: string } | null)?.code ?? null;
  const refs = ((refsRes.data ?? []) as Array<{
    id: string;
    status: string;
    points_awarded: number | null;
  }>);

  return {
    code,
    totalInvited: refs.length,
    totalConverted: refs.filter((r) => r.status === "COMPLETED").length,
    pointsEarned: refs.reduce((sum, r) => sum + (r.points_awarded ?? 0), 0),
  };
}

/**
 * Liste les parrainages d'un user (du plus recent au plus ancien),
 * enrichis du nom + email du filleul depuis `public.users`.
 */
export async function listReferralsForUser(
  userId: string,
): Promise<ReferralEntry[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("referrals")
    .select(
      `
      id, status, points_awarded, completed_at, created_at,
      referred:users!referred_id(first_name, last_name, email)
    `,
    )
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Array<{
    id: string;
    status: string;
    points_awarded: number | null;
    completed_at: string | null;
    created_at: string;
    referred: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  }>;

  return rows.map((r) => {
    const first = r.referred?.first_name ?? "";
    const last = r.referred?.last_name ?? "";
    const full = `${first} ${last}`.trim();
    return {
      id: r.id,
      status: r.status,
      points: r.points_awarded ?? 0,
      completedAt: r.completed_at,
      createdAt: r.created_at,
      referredName: full.length > 0 ? full : r.referred?.email ?? "Filleul",
      referredEmail: r.referred?.email ?? null,
    };
  });
}
