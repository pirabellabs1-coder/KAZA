import type { Metadata } from "next";
import { ShieldCheck, Wallet, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listTenantEscrowPayments } from "@/lib/queries/tenant-escrow";

// =============================================================================
// KAZA - Page Fonds en séquestre (escrow)
//
// Lecture réelle des paiements en séquestre du locataire via
// `listTenantEscrowPayments` (table escrow_payments, filtre tenant_id).
// Les KPIs sont calculés depuis les vraies lignes ; empty state honnête si
// aucune ligne.
// =============================================================================

export const metadata: Metadata = {
  title: "Fonds en séquestre",
};

export default async function EscrowPage() {
  const user = await getCurrentDisplayUser();
  const escrowPayments = user
    ? await listTenantEscrowPayments(user.id)
    : [];

  const totalHeld = escrowPayments
    .filter((p) => p.status === "held")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalReleased = escrowPayments
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + p.amount, 0);
  const disputedCount = escrowPayments.filter(
    (p) => p.status === "disputed",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Fonds en attente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez le statut de vos paiements en séquestre. Vos fonds sont
          sécurisés jusqu&apos;à la libération automatique au propriétaire.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-kaza-blue/10">
              <Wallet className="size-6 text-kaza-blue" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total en séquestre
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {formatPrice(totalHeld)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-kaza-green/10">
              <ShieldCheck className="size-6 text-kaza-green" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total libéré ce mois
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {formatPrice(totalReleased)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Litiges actifs
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {disputedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des paiements en séquestre (réels) */}
      {escrowPayments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
              <Wallet className="size-7 text-kaza-blue" />
            </div>
            <p className="mt-4 font-heading text-base font-semibold text-kaza-navy">
              Aucun paiement en séquestre
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Vos paiements de loyer en attente de libération au propriétaire
              apparaîtront ici, avec leur date de libération automatique.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {escrowPayments.map((p) => {
                const badge =
                  p.status === "released"
                    ? {
                        label: "Libéré au propriétaire",
                        cls: "bg-kaza-green/10 text-kaza-green",
                      }
                    : p.status === "disputed"
                      ? {
                          label: "Litige en cours",
                          cls: "bg-destructive/10 text-destructive",
                        }
                      : {
                          label: "En séquestre",
                          cls: "bg-kaza-blue/10 text-kaza-blue",
                        };
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10">
                        <Wallet className="size-5 text-kaza-blue" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatPrice(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Loyer en séquestre
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
