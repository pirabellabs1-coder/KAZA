// =============================================================================
// KAZA — Owner / Booster vos annonces (server)
// Charge les annonces du propriétaire + ses boosts actifs depuis Supabase,
// puis délègue l'UI interactive au client component <PromotionClient>.
// =============================================================================

import type { Metadata } from "next";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listPropertiesByOwner } from "@/lib/queries/owner-properties";
import { listActiveBoosts } from "@/actions/boosts";
import { PromotionClient } from "./promotion-client";

export const metadata: Metadata = {
  title: "Booster vos annonces",
};

export default async function PromotionPage() {
  const user = await getCurrentDisplayUser();
  const userId = user?.id ?? "";

  const [properties, boosts] = await Promise.all([
    userId ? listPropertiesByOwner(userId) : Promise.resolve([]),
    listActiveBoosts(),
  ]);

  return (
    <PromotionClient
      properties={properties.map((p) => ({ id: p.id, title: p.title }))}
      initialBoosts={boosts}
    />
  );
}
