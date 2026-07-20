import type { Metadata } from "next";
import Link from "next/link";
import { Tag, CheckCircle2, Home, BadgeCheck, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAllOffersAdmin } from "@/lib/queries/offers";
import { formatFcfa, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Ventes & offres — Admin Kaabo" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "border-amber-500 bg-amber-500/10 text-amber-700" },
  ACCEPTED: { label: "Acceptée", className: "bg-kaza-green text-white" },
  REJECTED: { label: "Refusée", className: "bg-muted text-muted-foreground" },
  DEPOSIT_PAID: { label: "Réservé", className: "bg-kaza-blue text-white" },
  CLOSED: { label: "Vendu", className: "bg-kaza-navy text-white" },
  CANCELLED: { label: "Annulée", className: "bg-gray-100 text-gray-600" },
  WITHDRAWN: { label: "Retirée", className: "bg-gray-100 text-gray-600" },
};

export default async function AdminOffersPage() {
  const { offers, stats } = await listAllOffersAdmin();

  const cards = [
    { label: "Offres totales", value: String(stats.total), icon: Tag },
    { label: "En attente", value: String(stats.pending), icon: CheckCircle2 },
    { label: "Réservés (acompte)", value: String(stats.reserved), icon: Home },
    { label: "Vendus", value: String(stats.closed), icon: BadgeCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy">
          Ventes &amp; offres d&apos;achat
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supervision du pipeline de vente : offres, acomptes versés et ventes
          conclues sur toute la plateforme.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                <c.icon className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold text-kaza-navy">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">
                Volume d&apos;acomptes versés
              </p>
              <p className="text-lg font-bold text-kaza-navy">
                {formatFcfa(stats.depositVolume)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-kaza-navy/10 text-kaza-navy">
              <BadgeCheck className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">
                Volume des ventes conclues
              </p>
              <p className="text-lg font-bold text-kaza-navy">
                {formatFcfa(stats.salesVolume)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Toutes les offres ({offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {offers.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              Aucune offre d&apos;achat pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Bien</th>
                    <th className="px-4 py-3 font-medium">Acheteur</th>
                    <th className="px-4 py-3 font-medium">Vendeur</th>
                    <th className="px-4 py-3 font-medium">Offre</th>
                    <th className="px-4 py-3 font-medium">Acompte</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => {
                    const badge = STATUS_BADGE[o.status] ?? {
                      label: o.status,
                      className: "bg-muted text-muted-foreground",
                    };
                    return (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            href={`/properties/${o.propertyId}`}
                            className="font-medium text-kaza-navy hover:underline"
                          >
                            {o.propertyTitle}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {o.propertyAddress}
                          </p>
                        </td>
                        <td className="px-4 py-3">{o.buyerName}</td>
                        <td className="px-4 py-3">{o.sellerName}</td>
                        <td className="px-4 py-3 font-semibold text-kaza-navy">
                          {formatFcfa(o.amount)}
                        </td>
                        <td className="px-4 py-3">{formatFcfa(o.deposit)}</td>
                        <td className="px-4 py-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(o.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
