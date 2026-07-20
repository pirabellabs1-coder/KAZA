import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Maisons à louer — Kaabo",
  description:
    "Découvrez toutes les maisons à louer sur Kaabo. Filtres avancés, annonces vérifiées, propriétaires sérieux.",
};

export default function MaisonsPage() {
  redirect("/search?type=HOUSE");
}
