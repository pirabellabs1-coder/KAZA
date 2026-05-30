import { Eye, CalendarCheck, Star, BarChart3 } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AnalyticsTabProps {
  /** Vues réelles cumulées (properties.views_count). */
  totalViews: number;
  /** Demandes de visite réelles reçues pour ce bien. */
  visitRequests: number;
  /** Nombre d'avis réels publiés. */
  reviewsCount: number;
  /** Note moyenne réelle (0 si aucun avis). */
  averageRating: number;
}

// Statistiques 100% réelles, lues depuis Supabase (vues, demandes de visite,
// avis). Aucun graphe ni série fabriquée : tant que le suivi quotidien des vues
// n'est pas instrumenté, on affiche un état honnête plutôt que des données
// inventées.
export function AnalyticsTab({
  totalViews,
  visitRequests,
  reviewsCount,
  averageRating,
}: AnalyticsTabProps) {
  const conversionRate =
    totalViews > 0
      ? Math.round((visitRequests / totalViews) * 100 * 10) / 10
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Vues totales"
          value={totalViews}
          icon={Eye}
          subtitle="Depuis la publication"
        />
        <StatsCard
          title="Demandes de visite"
          value={visitRequests}
          icon={CalendarCheck}
          subtitle="Reçues sur ce bien"
        />
        <StatsCard
          title="Taux de conversion"
          value={`${conversionRate}%`}
          subtitle="Vues vers demande"
          icon={BarChart3}
        />
        <StatsCard
          title="Note moyenne"
          value={reviewsCount > 0 ? averageRating.toFixed(1) : "—"}
          subtitle={
            reviewsCount > 0
              ? `Sur ${reviewsCount} avis`
              : "Aucun avis"
          }
          icon={Star}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution détaillée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Statistiques jour par jour bientôt disponibles
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              Le suivi quotidien des vues et des demandes de visite est en cours
              de déploiement. Les chiffres ci-dessus reflètent vos totaux réels
              en temps réel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
