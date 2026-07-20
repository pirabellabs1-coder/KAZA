"use server";

import "server-only";

// =============================================================================
// Kaabo — Export RGPD : l'utilisateur télécharge l'ensemble de ses données
// personnelles au format JSON (droit d'accès / portabilité — RGPD art. 15 & 20,
// APDP Bénin). On utilise le client utilisateur : la RLS garantit qu'on ne
// renvoie QUE les lignes appartenant à l'utilisateur courant.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export interface DataExportResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
  filename?: string;
}

// Chaque entrée : clé d'export → (table, colonne de filtrage user).
const USER_SCOPED_TABLES: Array<{
  key: string;
  table: string;
  column: string;
}> = [
  { key: "abonnements", table: "subscriptions", column: "user_id" },
  { key: "factures", table: "invoices", column: "user_id" },
  { key: "paiements", table: "payments", column: "user_id" },
  { key: "annonces", table: "properties", column: "owner_id" },
  { key: "favoris", table: "favorites", column: "user_id" },
  { key: "candidatures", table: "rental_applications", column: "applicant_id" },
  { key: "portefeuille", table: "user_wallets", column: "user_id" },
  { key: "transactions_wallet", table: "wallet_transactions", column: "user_id" },
  { key: "notifications", table: "notifications", column: "user_id" },
  { key: "profil_etudiant", table: "student_profiles", column: "user_id" },
];

export async function exportMyData(): Promise<DataExportResult> {
  const displayUser = await getCurrentDisplayUser();
  if (!displayUser) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const supabase = (await createClient()) as unknown as SupabaseClient;
  const userId = displayUser.id;

  const exported: Record<string, unknown> = {
    _meta: {
      genere_le: new Date().toISOString(),
      utilisateur_id: userId,
      description:
        "Export de vos données personnelles Kaabo (RGPD / APDP Bénin). " +
        "Seules les données vous appartenant sont incluses.",
    },
  };

  // Profil principal (table users).
  try {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      // On ne renvoie jamais le hash de mot de passe.
      const clean = { ...(data as Record<string, unknown>) };
      delete clean.password_hash;
      exported.profil = clean;
    }
  } catch {
    /* table absente / RLS : on ignore silencieusement */
  }

  // Tables liées à l'utilisateur (best-effort, en parallèle).
  const results = await Promise.allSettled(
    USER_SCOPED_TABLES.map(async ({ key, table, column }) => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, userId);
      if (error) throw error;
      return { key, rows: data ?? [] };
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.rows.length > 0) {
      exported[r.value.key] = r.value.rows;
    }
  }

  const datePart = new Date().toISOString().slice(0, 10);
  return {
    success: true,
    data: exported,
    filename: `kaza-mes-donnees-${datePart}.json`,
  };
}
