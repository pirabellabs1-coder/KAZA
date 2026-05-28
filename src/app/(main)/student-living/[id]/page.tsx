import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Détail Colocation — KAZA Student Living",
};

// =============================================================================
// KAZA — /student-living/[id]
// Les fiches détaillées de colocations seront re-générées une fois que la
// requête Supabase dédiée (`listings_colocation`) sera disponible. En
// attendant on retourne un 404 pour ne pas afficher de données fictives.
// =============================================================================

export default async function StudentLivingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // On consomme `params` pour respecter le contrat de l'App Router.
  await params;
  notFound();
}
