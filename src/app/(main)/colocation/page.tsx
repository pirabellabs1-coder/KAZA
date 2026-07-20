import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Colocation étudiante — Kaabo",
  description:
    "Trouvez une colocation étudiante près de votre campus avec Kaabo Academia. Logements meublés, frais partagés, ambiance saine.",
};

export default function ColocationPage() {
  redirect("/student-living");
}
