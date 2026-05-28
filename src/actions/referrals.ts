"use server";

// =============================================================================
// KAZA - Referrals (Server Actions)
//
// `referral_codes(user_id PK, code unique)` : 1 code par utilisateur.
// `referrals(referrer_id, referred_id, code, status, points_awarded, ...)`.
//
// Cette action garantit qu'un user a toujours un code utilisable : si
// la ligne n'existe pas encore elle est creee en testant plusieurs codes
// aleatoires en cas de collision (code unique vol 23505).
// =============================================================================

import "server-only";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

interface CodeResult {
  code: string | null;
  error?: string;
}

function genCode(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  const prefix = clean.length > 0 ? clean : "KAZ";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * Recupere le code de parrainage du user courant ; le cree s'il n'existe
 * pas. Reessaie jusqu'a 5 fois en cas de collision sur la contrainte
 * unique `code` (code Postgres 23505).
 */
export async function getOrCreateReferralCode(): Promise<CodeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { code: null, error: "Vous devez etre connecte." };

  // 1) Existe deja ?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from as any)("referral_codes")
    .select("code")
    .eq("user_id", user.id)
    .maybeSingle();
  const existingCode = (existing as { code?: string } | null)?.code;
  if (existingCode) return { code: existingCode };

  // 2) Prepare un seed lisible (initiales du prenom).
  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();
  const seed = profile?.first_name ?? "KAZA";

  // 3) Tente 5 codes — collision -> retry.
  for (let i = 0; i < 5; i++) {
    const code = genCode(seed);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase.from as any)(
      "referral_codes",
    )
      .insert({ user_id: user.id, code })
      .select("code")
      .single();

    if (inserted && (inserted as { code?: string }).code) {
      revalidatePath("/referral");
      return { code: (inserted as { code: string }).code };
    }
    // 23505 = unique_violation Postgres. Sinon on remonte l'erreur.
    if (error && (error as { code?: string }).code !== "23505") {
      return { code: null, error: error.message ?? "Erreur Supabase" };
    }
  }

  return { code: null, error: "Impossible de generer un code unique." };
}
