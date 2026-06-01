import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Tag,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Home,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOffersForBuyer } from "@/lib/queries/offers";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Espace acheteur — KAZA" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente du vendeur", className: "border-amber-500 bg-amber-500/10 text-amber-700" },
  ACCEPTED: { label: "Acceptée — acompte à verser", className: "bg-kaza-green text-white" },
  REJECTED: { label: "Non retenue", className: "bg-muted text-muted-foreground" },
  DEPOSIT_PAID: { label: "Réservé", className: "bg-kaza-blue text-white" },
  CLOSED: { label: "Acheté ✓", className: "bg-kaza-navy text-white" },
  CANCELLED: { label: "Annulée", className: "bg-gray-100 text-gray-600" },
  WITHDRAWN: { label: "Retirée", className: "bg-gray-100 text-gray-600" },
};

export default async function BuyerDashboardPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/buyer");

  const offers = await listOffersForBuyer(user.id);

  const counts = {
    total: offers.length,
    pending: offers.filter((o) => o.status === "PENDING").length,
    toPay: offers.filter((o) => o.status === "ACCEPTED").length,
    reserved: offers.filter((o) => o.status === "DEPOSIT_PAID").length,
    bought: offers.filter((o) => o.status === "CLOSED").length,
  };
  const recent = offers.slice(0, 4);
  const bought = offers.filter((o) => o.status === "CLOSED");

  const stats = [
    { label: "Offres envoyées", value: counts.total, icon: Tag },
    { label: "En attente vendeur", value: counts.pending, icon: Clock },
    { label: "Réservés", value: counts.reserved, icon: Home },
    { label: "Acquis", value: counts.bought, icon: BadgeCheck },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Espace acheteur
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez vos offres d&apos;achat et finalisez vos acquisitions.
          </p>
        </div>
        <Button asChild className="bg-kaza-blue hover:bg-kaza-blue/90">
          <Link href="/search?listingType=SALE">
            <Search className="mr-1.5 size-4" /> Parcourir les biens à vendre
          </Link>
        </Button>
      </div>

      {/* Alerte action : acompte à verser */}
      {counts.toPay > 0 && (
        <Link
          href="/buyer/offers"
          className="flex items-center justify-between gap-3 rounded-xl border border-kaza-green/40 bg-kaza-green/10 px-4 py-3 transition hover:bg-kaza-green/15"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-kaza-green">
            <CheckCircle2 className="size-4" />
            {counts.toPay} offre{counts.toPay > 1 ? "s" : ""} acceptée
            {counts.toPay > 1 ? "s" : ""} — versez l&apos;acompte pour réserver
          </span>
          <span className="text-xs font-semibold text-kaza-green">
            Payer l&apos;acompte →
          </span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-kaza-navy">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Tag className="size-7 text-amber-500" />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Vous n&apos;avez pas encore fait d&apos;offre. Parcourez les biens à
              vendre et faites une offre depuis la page d&apos;un bien.
            </p>
            <Button asChild className="bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/search?listingType=SALE">Voir les biens à vendre</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Offres récentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Offres récentes</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/buyer/offers">
                  Toutes mes offres <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recent.map((o) => {
                const badge = STATUS_BADGE[o.status] ?? {
                  label: o.status,
                  className: "bg-muted text-muted-foreground",
                };
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/properties/${o.propertyId}`}
                        className="truncate font-medium text-kaza-navy hover:underline"
                      >
                        {o.propertyTitle}
                      </Link>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {o.propertyAddress}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-kaza-navy">
                        {formatPrice(o.amount)}
                      </span>
                      <Badge className={`${badge.className} text-[10px]`}>
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Biens acquis */}
          {bought.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Mes acquisitions ({bought.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bought.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-kaza-navy/20 bg-kaza-navy/5 p-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/properties/${o.propertyId}`}
                        className="truncate font-medium text-kaza-navy hover:underline"
                      >
                        {o.propertyTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Offre du {formatDate(o.createdAt)} · vente finalisée
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-kaza-navy">
                      {formatPrice(o.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
