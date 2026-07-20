import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Appartements à louer — Kaabo",
  description:
    "Trouvez votre appartement à louer sur Kaabo. Studios, T2, T3, T4 vérifiés partout au Bénin.",
};

export default function AppartementsPage() {
  redirect("/search?type=APARTMENT");
}
