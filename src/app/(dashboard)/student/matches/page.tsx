import type { Metadata } from "next";

import { MatchesList } from "./matches-list";

export const metadata: Metadata = {
  title: "Mes matchs colocataires",
};

export default function StudentMatchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes matchs colocataires
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          8 profils compatibles trouvés grâce à votre profil colocataire.
        </p>
      </div>

      <MatchesList />
    </div>
  );
}
