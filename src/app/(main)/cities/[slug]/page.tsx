import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Ville | KAZA",
};

// =============================================================================
// KAZA — /cities/[slug]
// Les pages "ville" seront re-générées dès qu'un référentiel `cities` sera
// exposé via Supabase (avec photo, prix moyen et quartiers réels). En
// attendant on retourne un 404 pour ne pas afficher de données fictives.
// =============================================================================

export function generateStaticParams() {
  return [];
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  notFound();
}
