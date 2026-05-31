import type { Metadata } from "next";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";

import { CreateListingForm } from "./create-listing-form";

export const metadata: Metadata = {
  title: "Créer une annonce de colocation · KAZA",
  description:
    "Publiez une annonce de colocation étudiante sur KAZA. Trouvez vos futurs colocataires en quelques minutes.",
};

export const dynamic = "force-dynamic";

export default async function NewColocationPage() {
  const user = await getCurrentDisplayUser();
  return <CreateListingForm isAuthenticated={Boolean(user)} />;
}
