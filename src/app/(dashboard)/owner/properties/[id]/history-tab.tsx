import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// =============================================================================
// Kaabo — Onglet « Historique » du détail d'une annonce (espace propriétaire)
//
// Tant que la table activity_logs / la vue agrégée des évènements (paiements,
// visites, signatures, messages, avis, maintenance) n'est pas branchée, on
// affiche un empty state honnête. Aucune donnée de démonstration n'est
// injectée pour éviter d'induire en erreur le propriétaire.
// =============================================================================

export function HistoryTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique d&apos;activité</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
            <Clock className="size-6 text-kaza-blue" />
          </div>
          <p className="mt-3 font-heading text-base font-semibold text-kaza-navy">
            Aucun évènement enregistré
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            L&apos;historique de cette annonce (visites, signatures, paiements,
            messages, avis) s&apos;affichera ici dès qu&apos;une première
            interaction sera enregistrée sur Kaabo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
