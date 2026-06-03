import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Eye,
  Inbox,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { ReportGenerator } from "@/components/reports/report-generator";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getOwnerPropertyViews30d } from "@/lib/queries/analytics";
import { listOwnerPayments, listOwnerRentals } from "@/lib/queries/owner-activity";
import { formatNumber, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Rapports & analytics",
};

export const dynamic = "force-dynamic";

export default async function OwnerReportsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/owner/reports");

  // Vraies données 30 jours
  const [stats, payments, rentals] = await Promise.all([
    getOwnerPropertyViews30d(user.id),
    listOwnerPayments(user.id),
    listOwnerRentals(user.id),
  ]);

  // Revenus 30 derniers jours = somme des paiements COMPLETED des 30 derniers jours
  // eslint-disable-next-line react-hooks/purity -- Server Component rendu une fois par requete / valeur temporelle stable — appel horloge acceptable ici
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const completed30d = payments.filter(
    (p) => p.status === "COMPLETED" && new Date(p.createdAt).getTime() >= since,
  );
  const revenue30d = completed30d.reduce((s, p) => s + (p.amount ?? 0), 0);

  const noPaymentsYet = payments.length === 0;
  const noPropertiesYet = stats.viewsByProperty.length === 0;

  // Performance par bien (vraies vues par propriété — contacts/favorites
  // disponibles uniquement en cumulé pour l'instant).
  const propertyPerf = stats.viewsByProperty.map((p) => ({
    id: p.propertyId,
    title: p.title,
    views: p.views,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Rapports & analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Synthèse financière et performance de vos biens — 30 derniers jours.
        </p>
      </div>

      {/* Synthèse financière 30j */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Synthèse financière — 30 derniers jours
          </h2>
          <p className="text-xs text-muted-foreground">
            Issue des paiements complétés sur la plateforme.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-kaza-green">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider">
                Revenus reçus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-foreground">
                {formatPrice(revenue30d)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {completed30d.length} paiement{completed30d.length !== 1 ? "s" : ""} complété{completed30d.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-kaza-blue">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider">
                Locations actives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-foreground">
                {rentals.filter((r) => r.status === "ACTIVE").length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                sur {rentals.length} location{rentals.length !== 1 ? "s" : ""} au total
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider">
                Vues cumulées 30j
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-foreground">
                {formatNumber(stats.totalViews)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {stats.totalContacts} contacts · {stats.totalFavorites} favoris
              </p>
            </CardContent>
          </Card>
        </div>

        {noPaymentsYet && (
          <Card className="rounded-2xl border-dashed bg-muted/30">
            <CardContent className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
              <Inbox className="size-5 shrink-0" />
              <p>
                Aucun paiement reçu sur les 30 derniers jours. Les revenus
                apparaîtront ici dès le premier encaissement via la plateforme.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Performance des annonces */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Performance des annonces
            </h2>
            <p className="text-xs text-muted-foreground">
              Vues, contacts et conversion par bien — 30 derniers jours.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/owner/analytics">
              <BarChart3 className="mr-2 size-4" />
              Voir analytics détaillé
            </Link>
          </Button>
        </div>

        {noPropertiesYet ? (
          <Card className="rounded-2xl border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <BarChart3 className="size-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aucune donnée de performance pour le moment
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Publiez votre premier bien pour suivre vues, contacts et taux
                de conversion.
              </p>
              <Button asChild size="sm" className="mt-2 bg-kaza-blue hover:bg-kaza-blue/90">
                <Link href="/owner/properties/new">Publier une annonce</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px]">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Bien
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Vues 30j
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyPerf.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b transition-colors last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {p.title}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          {formatNumber(p.views)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                            aria-label="Voir l'annonce"
                          >
                            <Link href={`/owner/properties/${p.id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Export comptable — générateur réel (CSV/Excel) */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Export comptable
          </h2>
          <p className="text-xs text-muted-foreground">
            Téléchargez vos revenus et votre activité pour votre comptable.
          </p>
        </div>
        <ReportGenerator
          space="owner"
          types={[
            { value: "financial", label: "Revenus (loyers encaissés)" },
            { value: "activity", label: "Activité (visites)" },
          ]}
        />
      </section>

      {/* Insights — branche quand on aura un moteur de recommandations */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Insights
          </h2>
          <p className="text-xs text-muted-foreground">
            Conseils personnalisés pour optimiser vos revenus (à venir).
          </p>
        </div>
        <Card className="rounded-2xl border-dashed bg-muted/30">
          <CardContent className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
            <TrendingUp className="size-5 shrink-0" />
            <p>
              Les recommandations personnalisées (prix, photos, délais de
              réponse) seront générées dès qu&apos;il y aura assez d&apos;activité
              sur vos annonces.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
