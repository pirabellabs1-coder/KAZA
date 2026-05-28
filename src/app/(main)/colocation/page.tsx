import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Colocation étudiante — KAZA",
  description:
    "Trouvez une colocation étudiante près de votre campus avec KAZA Academia. Logements meublés, frais partagés, ambiance saine.",
};

export default function ColocationPage() {
  redirect("/student-living");
}
