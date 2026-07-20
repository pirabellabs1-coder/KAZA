import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  TrendingUp,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataExportButtons } from "@/components/dashboard/data-export-buttons";
import { PortfolioBrowser } from "./portfolio-browser";
import { Card, CardContent } from "@/components/ui/card";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getActiveSubscription,
  PLAN_DETAILS,
  PLAN_LISTING_QUOTA,
} from "@/lib/queries/subscriptions";
import {
  getOwnerPortfolioStats,
  listPropertiesByOwner,
} from "@/lib/queries/owner-properties";

export const metadata: Metadata = {
  title: "Portefeuille — Kaabo Agence",
  description:
    "Visualisez et pilotez toutes les annonces gérées par votre agence.",
};

// ---------------------------------------------------------------------------
// Helpers / Référentiels
// ---------------------------------------------------------------------------


function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgencyPortfolioPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login");
  }

  const [properties, stats, subscription] = await Promise.all([
    listPropertiesByOwner(user.id),
    getOwnerPortfolioStats(user.id),
    getActiveSubscription(user.id),
  ]);

  const total = stats.total;
  const available = stats.available;
  const rented = stats.rented;
  const draft = stats.draft;

  // Plan + quota d'annonces réels (table subscriptions). 0 = illimité.
  const planKey = subscription?.plan ?? null;
  const planName = planKey
    ? PLAN_DETAILS[planKey]?.name ?? planKey
    : "Aucun abonnement actif";
  const quotaMax = planKey ? PLAN_LISTING_QUOTA[planKey] ?? 0 : 0;
  const quotaUsed = available + rented; // annonces "actives"
  const quotaUnlimited = quotaMax === 0;
  const quotaPct = quotaUnlimited
    ? 0
    : Math.round((quotaUsed / quotaMax) * 100);
  const quotaWarn = !quotaUnlimited && quotaPct >= 90;

  const isEmpty = total === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-kaza-navy">
            Portefeuille
          </h1>
          <p className="mt-1 text-muted-foreground">
            {quotaUsed} annonces actives
            {quotaUnlimited ? "" : ` sur ${quotaMax}`} — quota{" "}
            <span className="font-medium text-kaza-navy">{planName}</span>
          </p>
          {/* Barre de progression quota (masquée si illimité / sans plan) */}
          {!quotaUnlimited && (
            <div className="mt-4 max-w-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Utilisation du quota
                </span>
                <span
                  className={`font-semibold ${
                    quotaWarn ? "text-amber-600" : "text-kaza-navy"
                  }`}
                >
                  {quotaPct}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaWarn
                      ? "bg-amber-500"
                      : "bg-gradient-to-r from-kaza-blue to-kaza-green"
                  }`}
                  style={{ width: `${Math.min(quotaPct, 100)}%` }}
                />
              </div>
              {quotaWarn && (
                <p className="mt-2 text-xs text-amber-700">
                  Vous approchez de la limite. Pensez à passer au plan supérieur.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <DataExportButtons
            filename="kaabo-portefeuille"
            pdf={false}
            rows={properties.map((p) => ({
              Titre: p.title,
              Type: p.type,
              Statut: p.status,
              "Prix (FCFA)": p.price,
              Chambres: p.bedrooms,
              "Salles de bain": p.bathrooms,
              "Surface (m2)": p.sqm,
              Adresse: p.address,
              Vues: p.viewsCount,
            }))}
          />
          <Button
            asChild
            className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
          >
            <Link href="/owner/properties/new">
              <Plus className="mr-2 size-4" />
              Ajouter une annonce
            </Link>
          </Button>
        </div>
      </div>

      {!isEmpty && (
        <>
          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill
              icon={<CheckCircle2 className="size-5 text-kaza-green" />}
              label="Disponibles"
              value={available}
              subtitle={`${pct(available, total)} du total`}
              tone="green"
            />
            <StatPill
              icon={<Building2 className="size-5 text-kaza-blue" />}
              label="Loués"
              value={rented}
              subtitle={`${pct(rented, total)} du total`}
              tone="blue"
            />
            <StatPill
              icon={<Clock className="size-5 text-amber-600" />}
              label="Brouillons"
              value={draft}
              subtitle={`${pct(draft, total)} du total`}
              tone="amber"
            />
            <StatPill
              icon={<Archive className="size-5 text-muted-foreground" />}
              label="Vues cumulées"
              value={stats.totalViews}
              subtitle="Depuis publication"
              tone="muted"
            />
          </div>

          {/* Filtres interactifs + grille (client) */}
          <PortfolioBrowser properties={properties} />

          {/* Footer global */}
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-kaza-navy via-kaza-navy/95 to-kaza-blue text-white shadow-lg">
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
                  <TrendingUp className="size-6 text-emerald-300" />
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold">
                    Performance globale du portefeuille
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {total} annonces générant{" "}
                    <span className="font-semibold text-white">
                      {stats.totalViews.toLocaleString("fr-FR")}
                    </span>{" "}
                    vues — revenu potentiel{" "}
                    <span className="font-semibold text-emerald-300">
                      {formatFcfa(stats.totalMonthlyRevenuePotential)}
                    </span>{" "}
                    / mois
                  </p>
                </div>
              </div>
              <Link
                href="/agency/analytics"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-kaza-navy transition hover:bg-white/90"
              >
                Voir les analytics
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </>
      )}

      {isEmpty && <EmptyState />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  tone: "green" | "blue" | "amber" | "muted";
}

function StatPill({ icon, label, value, subtitle, tone }: StatPillProps) {
  const bg =
    tone === "green"
      ? "bg-emerald-50"
      : tone === "blue"
        ? "bg-kaza-blue/10"
        : tone === "amber"
          ? "bg-amber-50"
          : "bg-muted";

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${bg}`}
          >
            {icon}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold text-kaza-navy">
          {value.toLocaleString("fr-FR")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="rounded-2xl border-dashed border-2 border-border bg-gradient-to-br from-white via-muted/20 to-kaza-blue/[0.04] shadow-sm">
      <CardContent className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <Building2 className="size-10 text-kaza-blue" />
        </div>
        <h2 className="mt-6 font-heading text-2xl font-bold text-kaza-navy">
          Aucune propriété enregistrée
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Votre agence n&apos;a encore publié aucune annonce. Lancez votre
          portefeuille en moins de 5 minutes avec votre première mise en ligne.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 h-12 bg-kaza-navy px-8 text-base text-white shadow-md hover:bg-kaza-navy/90"
        >
          <Link href="/owner/properties/new">
            <Plus className="mr-2 size-5" />
            Publier la première annonce
          </Link>
        </Button>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Archive className="size-3.5" />
          Vos brouillons restent privés tant que vous ne les publiez pas.
        </p>
      </CardContent>
    </Card>
  );
}
