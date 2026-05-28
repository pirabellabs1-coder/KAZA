import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AuthRole = "OWNER" | "TENANT" | "STUDENT" | "AGENCY" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AuthRole;
  isDemo: boolean;
}

const VALID_ROLES: AuthRole[] = [
  "OWNER",
  "TENANT",
  "STUDENT",
  "AGENCY",
  "ADMIN",
];

function coerceRole(value: unknown): AuthRole {
  return typeof value === "string" && (VALID_ROLES as string[]).includes(value)
    ? (value as AuthRole)
    : "TENANT";
}

/**
 * Retourne l'utilisateur courant authentifié via Supabase Auth, enrichi
 * des informations de profil stockées dans `public.users`.
 *
 * Plus aucun fallback cookie démo : si pas de session Supabase → null.
 * Si la session existe mais que `public.users` n'a pas encore sa ligne
 * (race avec le trigger `on_auth_user_created`), fallback sur les
 * `user.user_metadata`.
 */
export async function getCurrentDisplayUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const meta = (user.user_metadata ?? {}) as {
    first_name?: string;
    last_name?: string;
    role?: string;
  };

  // Récupère le profil canonique depuis public.users (alimenté par le
  // trigger on_auth_user_created). Si la ligne n'existe pas encore on
  // retombe sur les metadata du signup.
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    profile?.first_name ??
    meta.first_name ??
    user.email?.split("@")[0] ??
    "Utilisateur";
  const lastName = profile?.last_name ?? meta.last_name ?? "";
  const role: AuthRole = coerceRole(profile?.role ?? meta.role);

  return {
    id: user.id,
    email: user.email ?? "",
    firstName,
    lastName,
    role,
    isDemo: false,
  };
}
