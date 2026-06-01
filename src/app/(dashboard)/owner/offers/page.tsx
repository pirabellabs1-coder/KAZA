import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Tag, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listOffersForSeller } from "@/lib/queries/offers";
import { formatPrice, formatDate } from "@/lib/utils";

import { OfferDecisionButtons } from "./offer-actions";

export const metadata: Metadata = { title: "Offres d'achat reçues — KAZA" };
export const dynamic = "force-dynamic";

const OWNER_ROLES = new Set(["OWNER", "AGENCY", "ADMIN"]);

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "border-amber-500 bg-amber-500/10 text-amber-700" },
  ACCEPTED: { label: "Acceptée", className: "bg-kaza-green text-white" },
  REJECTED: { label: "Refusée", className: "bg-muted text-muted-foreground" },
  DEPOSIT_PAID: { label: "Réservé (acompte versé)", className: "bg-kaza-blue text-white" },
  CLOSED: { label: "Vendu", className: "bg-kaza-navy text-white" },
  CANCELLED: { label: "Annulée", className: "bg-gray-100 text-gray-600" },
  WITHDRAWN: { label: "Retirée", className: "bg-gray-100 text-gray-600" },
};

export default async function OwnerOffersPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/owner/offers");
  if (!OWNER_ROLES.has(user.role)) redirect("/dashboard");

  const offers = await listOffersForSeller(user.id);
  const pending = offers.filter((o) => o.status === "PENDING");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Offres d&apos;achat reçues
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {offers.length === 0
            ? "Les offres sur vos biens à vendre apparaîtront ici."
            : `${offers.length} offre${offers.length > 1 ? "s" : ""} · ${pending.length} en attente`}
        </p>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Tag className="size-7 text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aucune offre pour le moment. Publiez un bien « À vendre » pour
              recevoir des offres d&apos;acheteurs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((o) => {
            const badge = STATUS_BADGE[o.status] ?? {
              label: o.status,
              className: "bg-muted text-muted-foreground",
            };
            return (
              <Card key={o.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/properties/${o.propertyId}`}
                        className="font-heading text-lg font-semibold text-kaza-navy hover:underline"
                      >
                        {o.propertyTitle}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {o.propertyAddress}
                      </p>
                    </div>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-y py-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Acheteur
                      </p>
                      <p className="font-medium">{o.counterpartyName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Offre
                      </p>
                      <p className="font-semibold text-kaza-navy">
                        {formatPrice(o.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Acompte attendu
                      </p>
                      <p className="font-medium">{formatPrice(o.deposit)}</p>
                    </div>
                  </div>

                  {o.message && (
                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      « {o.message} »
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Reçue le {formatDate(o.createdAt)}
                    </span>
                    {o.status === "PENDING" && (
                      <OfferDecisionButtons offerId={o.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
