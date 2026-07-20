import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Tag, MapPin, Search } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { listOffersForBuyer } from "@/lib/queries/offers";
import { formatPrice, formatDate } from "@/lib/utils";

import { DepositPaymentButton } from "./deposit-payment";

export const metadata: Metadata = { title: "Mes offres d'achat — Kaabo" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente du vendeur", className: "border-amber-500 bg-amber-500/10 text-amber-700" },
  ACCEPTED: { label: "Acceptée", className: "bg-kaza-green text-white" },
  REJECTED: { label: "Non retenue", className: "bg-muted text-muted-foreground" },
  DEPOSIT_PAID: { label: "Réservé", className: "bg-kaza-blue text-white" },
  CLOSED: { label: "Vente conclue", className: "bg-kaza-navy text-white" },
  CANCELLED: { label: "Annulée", className: "bg-gray-100 text-gray-600" },
  WITHDRAWN: { label: "Retirée", className: "bg-gray-100 text-gray-600" },
};

export default async function BuyerOffersPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/buyer/offers");

  const offers = await listOffersForBuyer(user.id);

  // Solde wallet (pour proposer le paiement immédiat de l'acompte).
  let walletBalance = 0;
  try {
    const supabase = (await createClient()) as unknown as SupabaseClient;
    const { data } = await supabase
      .from("user_wallets")
      .select("balance_fcfa")
      .eq("user_id", user.id)
      .maybeSingle();
    walletBalance = Number(
      (data as { balance_fcfa?: number } | null)?.balance_fcfa ?? 0,
    );
  } catch {
    walletBalance = 0;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Mes offres d&apos;achat
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {offers.length === 0
              ? "Vous n'avez pas encore fait d'offre."
              : `${offers.length} offre${offers.length > 1 ? "s" : ""} envoyée${offers.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/search?listingType=SALE">
            <Search className="mr-1.5 size-4" /> Biens à vendre
          </Link>
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Tag className="size-7 text-amber-500" />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Parcourez les biens à vendre et faites une offre depuis la page du
              bien. Vous suivrez ici les réponses des vendeurs.
            </p>
            <Button asChild className="bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/search?listingType=SALE">Voir les biens à vendre</Link>
            </Button>
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

                  <div className="grid grid-cols-2 gap-3 border-y py-3 text-sm">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Votre offre
                      </p>
                      <p className="font-semibold text-kaza-navy">
                        {formatPrice(o.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        Acompte de réservation
                      </p>
                      <p className="font-medium">{formatPrice(o.deposit)}</p>
                    </div>
                  </div>

                  {o.status === "ACCEPTED" && (
                    <div className="rounded-lg bg-kaza-green/10 px-3 py-2 text-xs text-kaza-green">
                      Offre acceptée ✓ — versez l&apos;acompte de réservation de{" "}
                      <strong>{formatPrice(o.deposit)}</strong> pour bloquer le
                      bien. La vente est ensuite finalisée chez le notaire.
                    </div>
                  )}
                  {o.status === "DEPOSIT_PAID" && (
                    <div className="rounded-lg bg-kaza-blue/10 px-3 py-2 text-xs text-kaza-blue">
                      Acompte versé ✓ — le bien est <strong>réservé</strong> à
                      votre nom. Finalisez la signature chez le notaire avec le
                      vendeur.
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Envoyée le {formatDate(o.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      {o.status === "ACCEPTED" && (
                        <DepositPaymentButton
                          offerId={o.id}
                          deposit={o.deposit}
                          walletBalance={walletBalance}
                        />
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/properties/${o.propertyId}`}>
                          Voir le bien
                        </Link>
                      </Button>
                    </div>
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
