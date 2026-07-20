import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { PropertyCreateWizard } from "./property-create-wizard";

export const metadata: Metadata = {
  title: "Publier un bien — Kaabo",
  description:
    "Publiez votre bien immobilier en Afrique de l'Ouest sur Kaabo en quelques minutes.",
};

export default async function NewPropertyPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/owner/properties/new");
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-0 sm:px-2">
      <PropertyCreateWizard userId={user.id} />
    </div>
  );
}
