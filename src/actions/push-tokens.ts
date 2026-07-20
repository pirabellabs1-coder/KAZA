"use server";

// =============================================================================
// Kaabo - Push Tokens (Server Actions)
// Wave 4 - Aminata Traore
//
// Enregistrement et desinscription des tokens FCM (web / iOS / android).
// Branche directement sur la table `user_push_tokens` (migration 00007 par
// Kwame). Convention de retour : `{ success: true } | { success: false; error }`.
//
// Best-effort : on log et on retourne `{success: false}` plutot que de throw
// afin de ne jamais casser l'UI cote client (banniere de demande de permission).
// =============================================================================

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import type { ActionResult } from "./notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PushPlatform = "web" | "ios" | "android";

interface RegisterPushTokenInput {
  token: string;
  platform: PushPlatform;
}

// TODO: type manquant - la table `user_push_tokens` n'est pas encore exposee
// dans `src/types/supabase.ts`. A regenerer apres la migration 00007.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Actions publiques
// ---------------------------------------------------------------------------

/**
 * Enregistre (ou rafraichit) un token push pour l'utilisateur courant.
 *
 * Logique UPSERT : si le couple (user_id, token) existe deja, on remet
 * `enabled=true` et on met a jour `last_used_at`. C'est utile quand
 * l'utilisateur a desactive puis reactive les notifications, ou simplement
 * pour suivre la derniere utilisation d'un appareil.
 */
export async function registerPushToken(
  input: RegisterPushTokenInput
): Promise<ActionResult> {
  if (!input?.token || !input?.platform) {
    return { success: false, error: "Token ou plateforme manquant." };
  }

  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  try {
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("user_push_tokens" as any)
      .upsert(
        {
          user_id: user.id,
          token: input.token,
          platform: input.platform,
          enabled: true,
          last_used_at: new Date().toISOString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        { onConflict: "user_id,token" }
      );

    if (error) {
      console.warn(
        "[push-tokens] upsert impossible (table absente ?)",
        error.message
      );
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.warn("[push-tokens] exception lors de l'enregistrement", err);
    return {
      success: false,
      error: "Impossible d'enregistrer le token push.",
    };
  }
}

/**
 * Desactive un token push pour l'utilisateur courant.
 * On garde la ligne en base (pour conserver l'historique) mais on positionne
 * `enabled=false` afin qu'aucun envoi FCM ne soit declenche.
 */
export async function unregisterPushToken(
  token: string
): Promise<ActionResult> {
  if (!token) {
    return { success: false, error: "Token manquant." };
  }

  const supabase = await getLooseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Vous devez etre connecte." };
  }

  try {
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("user_push_tokens" as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ enabled: false } as any)
      .eq("user_id", user.id)
      .eq("token", token);

    if (error) {
      console.warn(
        "[push-tokens] desactivation impossible",
        error.message
      );
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.warn("[push-tokens] exception lors de la desactivation", err);
    return {
      success: false,
      error: "Impossible de desactiver le token push.",
    };
  }
}
