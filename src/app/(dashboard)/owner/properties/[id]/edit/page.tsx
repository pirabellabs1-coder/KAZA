import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { EditPropertyForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Modifier l'annonce",
};

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Page d'édition d'une annonce — fetch direct Supabase, vérification de
 * l'ownership côté serveur (403 si l'user n'est pas le owner_id).
 */
export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const supabase = await createClient();
  const { data: property, error } = await supabase
    .from("properties")
    .select(
      "id, owner_id, title, description, price, bedrooms, bathrooms, square_meters, address, amenities, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[owner/edit] fetch property:", error.message);
  }

  if (!property) {
    notFound();
  }

  // Garde de propriété — 403 implicite via redirect vers la liste.
  if ((property as { owner_id: string }).owner_id !== user.id) {
    redirect("/owner/properties?erreur=Accès+non+autorisé");
  }

  const p = property as {
    id: string;
    title: string | null;
    description: string | null;
    price: number;
    bedrooms: number | null;
    bathrooms: number | null;
    square_meters: number | null;
    address: string | null;
    amenities: string[] | null;
    status: string | null;
  };

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-6 px-0 sm:px-2">
      {/* Breadcrumbs */}
      <nav
        aria-label="Fil d'Ariane"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <Home className="size-3.5" />
          Tableau de bord
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/owner/properties" className="hover:text-foreground">
          Mes biens
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/owner/properties/${p.id}`}
          className="hover:text-foreground"
        >
          {p.title ?? "Annonce"}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Modifier</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Modifier l&apos;annonce
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mettez à jour les informations de votre bien. Les modifications sont
          enregistrées dans la base de données.
        </p>
      </div>

      <EditPropertyForm
        propertyId={p.id}
        initialValues={{
          title: p.title ?? "",
          description: p.description ?? "",
          price: Number(p.price) || 0,
          bedrooms: p.bedrooms ?? 0,
          bathrooms: p.bathrooms ?? 0,
          squareMeters: p.square_meters ?? 0,
          address: p.address ?? "",
          amenities: p.amenities ?? [],
          status: normalizeStatus(p.status),
        }}
      />
    </div>
  );
}

/** Normalise un status DB en un statut utilisable par le formulaire owner. */
function normalizeStatus(
  raw: string | null,
):
  | "DRAFT"
  | "AVAILABLE"
  | "RENTED"
  | "UNAVAILABLE"
  | "ARCHIVED" {
  const allowed = [
    "DRAFT",
    "AVAILABLE",
    "RENTED",
    "UNAVAILABLE",
    "ARCHIVED",
  ] as const;
  if (raw && (allowed as readonly string[]).includes(raw)) {
    return raw as (typeof allowed)[number];
  }
  // PENDING_REVIEW (ou autre) → on bascule en DRAFT pour l'édition.
  return "DRAFT";
}
