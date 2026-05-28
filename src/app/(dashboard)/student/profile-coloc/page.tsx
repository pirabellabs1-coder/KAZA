import type { Metadata } from "next";

import { ColocForm } from "./coloc-form";

export const metadata: Metadata = {
  title: "Mon profil colocataire",
};

export default function ProfileColocPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mon profil colocataire
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plus votre profil est complet, plus l&apos;algorithme KAZA peut vous
          proposer des matchs précis.
        </p>
      </div>

      <ColocForm />
    </div>
  );
}
