"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit/write-log";

// =============================================================================
// Kaabo — Actions de modération des utilisateurs (espace admin).
// Suspension/bannissement via le bannissement natif Supabase Auth
// (`ban_duration`) — un utilisateur banni ne peut plus se connecter. Garde
// ADMIN + journal d'audit sur chaque action.
// =============================================================================

export interface AdminUserActionResult {
  success: boolean;
  error?: string;
}

const PERMA_BAN = "876000h"; // ~100 ans = bannissement permanent
const VALID_ROLES = ["OWNER", "TENANT", "STUDENT", "AGENCY", "ADMIN"];

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getCurrentDisplayUser();
  if (!user) return { ok: false, error: "Authentification requise." };
  if (user.role !== "ADMIN") {
    return { ok: false, error: "Réservé aux administrateurs." };
  }
  return { ok: true };
}

function admin(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

async function applyBan(
  ids: string[],
  duration: string,
): Promise<{ ok: number; fail: number }> {
  const db = admin();
  let ok = 0;
  let fail = 0;
  for (const id of ids) {
    const { error } = await db.auth.admin.updateUserById(id, {
      ban_duration: duration,
    });
    if (error) fail += 1;
    else ok += 1;
  }
  return { ok, fail };
}

export async function suspendUsers(
  ids: string[],
  reason: string,
  notify: boolean,
): Promise<AdminUserActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!ids?.length) return { success: false, error: "Aucun utilisateur sélectionné." };
  void notify;

  const { ok } = await applyBan(ids, PERMA_BAN);
  if (ok === 0) return { success: false, error: "Échec de la suspension." };

  for (const id of ids) {
    await writeAuditLog({
      action: "USER_SUSPENDED",
      targetType: "USER",
      targetId: id,
      reason: reason || undefined,
    });
  }
  revalidatePath("/admin/users");
  return { success: true };
}

export async function banUsers(
  ids: string[],
  reason: string,
  notify: boolean,
): Promise<AdminUserActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!ids?.length) return { success: false, error: "Aucun utilisateur sélectionné." };
  void notify;

  const { ok } = await applyBan(ids, PERMA_BAN);
  if (ok === 0) return { success: false, error: "Échec du bannissement." };

  for (const id of ids) {
    await writeAuditLog({
      action: "USER_BANNED",
      targetType: "USER",
      targetId: id,
      reason: reason || undefined,
    });
  }
  revalidatePath("/admin/users");
  return { success: true };
}

export async function reactivateUser(
  id: string,
): Promise<AdminUserActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!id) return { success: false, error: "Utilisateur introuvable." };

  const { error } = await admin().auth.admin.updateUserById(id, {
    ban_duration: "none",
  });
  if (error) return { success: false, error: "Échec de la réactivation." };

  await writeAuditLog({
    action: "USER_REACTIVATED",
    targetType: "USER",
    targetId: id,
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function changeUserRole(
  id: string,
  role: string,
): Promise<AdminUserActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  if (!id) return { success: false, error: "Utilisateur introuvable." };
  if (!VALID_ROLES.includes(role)) {
    return { success: false, error: "Rôle invalide." };
  }

  const db = admin();
  // 1) Colonne users.role (source de vérité applicative).
  const { error: roleErr } = await db
    .from("users")
    .update({ role })
    .eq("id", id);
  if (roleErr) return { success: false, error: roleErr.message };

  // 2) user_metadata.role (le middleware s'y fie en priorité pour le RBAC).
  await db.auth.admin.updateUserById(id, { user_metadata: { role } });

  await writeAuditLog({
    action: "USER_ROLE_CHANGED",
    targetType: "USER",
    targetId: id,
    metadata: { role },
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function impersonateUser(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- impersonation désactivée (sécurité) ; on conserve la signature
  id: string,
): Promise<AdminUserActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.error };
  // L'impersonation (ouvrir une session au nom d'un autre) est volontairement
  // désactivée pour des raisons de sécurité/traçabilité.
  return {
    success: false,
    error:
      "L'impersonation n'est pas disponible (sécurité). Utilisez les exports/logs pour investiguer.",
  };
}
