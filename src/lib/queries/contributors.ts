import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA — Query admin : utilisateurs pouvant devenir contributeurs (CMS).
// =============================================================================

export interface ContributorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isContributor: boolean;
}

export async function listUsersForContributors(
  limit = 200,
): Promise<ContributorUser[]> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data, error } = await admin
    .from("users")
    .select("id, first_name, last_name, email, role, is_contributor")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[contributors] list:", error.message);
    return [];
  }

  return (
    (data ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      role: string;
      is_contributor: boolean | null;
    }>
  ).map((u) => ({
    id: u.id,
    name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
    email: u.email,
    role: u.role,
    isContributor: u.is_contributor === true,
  }));
}

export interface WriterOption {
  id: string;
  name: string;
  role: string;
}

/**
 * Liste les rédacteurs sélectionnables comme auteur d'un article :
 * administrateurs + contributeurs. Sert au sélecteur « Rédacteur » de l'éditeur.
 */
export async function listWriters(limit = 200): Promise<WriterOption[]> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data, error } = await admin
    .from("users")
    .select("id, first_name, last_name, email, role, is_contributor")
    .or("role.eq.ADMIN,is_contributor.eq.true")
    .order("role", { ascending: true })
    .limit(limit);

  if (error) {
    console.warn("[contributors] listWriters:", error.message);
    return [];
  }

  return (
    (data ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      role: string;
      is_contributor: boolean | null;
    }>
  ).map((u) => ({
    id: u.id,
    name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
    role: u.role,
  }));
}
