"use server";

import "server-only";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getPointsBalance } from "@/lib/queries/kaza-points";

// =============================================================================
// Kaabo — Server action : solde Kaabo Points de l'utilisateur courant.
// Sert au badge de la barre d'outils (composant client).
// =============================================================================

export async function getMyKazaPoints(): Promise<number> {
  const user = await getCurrentDisplayUser();
  if (!user) return 0;
  try {
    return await getPointsBalance(user.id);
  } catch {
    return 0;
  }
}
