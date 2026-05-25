import type { Metadata } from "next";
import { getPropertiesByOwner as mockGetPropertiesByOwner } from "@/lib/mock-data";
import { getPropertiesByOwner as supabaseGetPropertiesByOwner } from "@/lib/supabase/queries/properties";
import { getCurrentUser } from "@/lib/supabase/queries/users";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { OwnerPropertiesList } from "./properties-list";

export const metadata: Metadata = {
  title: "Mes Propriétés",
};

// Fallback dev quand Supabase est absent (cohérent avec les mocks).
const MOCK_OWNER_ID = "u-002-owner-jean";

export default async function OwnerPropertiesPage() {
  const properties = await fetchWithFallback(
    async () => {
      const user = await getCurrentUser();
      if (!user) return [];
      return supabaseGetPropertiesByOwner(user.id);
    },
    () => mockGetPropertiesByOwner(MOCK_OWNER_ID),
  );

  return <OwnerPropertiesList properties={properties} />;
}
