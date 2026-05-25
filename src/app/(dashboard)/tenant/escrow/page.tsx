import type { Metadata } from "next";
import { ShieldCheck, Wallet, Clock, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EscrowTimeline,
  type EscrowStatus,
} from "@/components/payments/escrow-timeline";
import { formatPrice, formatDate } from "@/lib/utils";

// =============================================================================
// KAZA - Page Fonds en séquestre (escrow)
// =============================================================================

export const metadata: Metadata = {
  title: "Fonds en séquestre",
};

// Mock data : 5 paiements en différents états
const MOCK_ESCROW_PAYMENTS = [
  {
    id: "esc-001",
    propertyTitle: "Appartement 3 pièces - Cocotomey",
    propertyAddress: "Cotonou, Bénin",
    amount: 154500,
    paidAt: "2026-05-20T10:30:00Z",
    releaseAt: "2026-05-27T10:30:00Z",
    status: "held" as EscrowStatus,
    period: "Loyer juin 2026",
  },
  {
    id: "esc-002",
    propertyTitle: "Studio meublé - Akpakpa",
    propertyAddress: "Cotonou, Bénin",
    amount: 82400,
    paidAt: "2026-05-15T14:00:00Z",
    releaseAt: "2026-05-22T14:00:00Z",
    status: "released" as EscrowStatus,
    period: "Loyer mai 2026",
  },
  {
    id: "esc-003",
    propertyTitle: "Villa 4 chambres - Calavi",
    propertyAddress: "Abomey-Calavi, Bénin",
    amount: 309000,
    paidAt: "2026-05-23T09:15:00Z",
    releaseAt: "2026-05-30T09:15:00Z",
    status: "held" as EscrowStatus,
    period: "Loyer juin 2026",
  },
  {
    id: "esc-004",
    propertyTitle: "Chambre étudiant - Campus UAC",
    propertyAddress: "Abomey-Calavi, Bénin",
    amount: 46350,
    paidAt: "2026-05-10T16:45:00Z",
    releaseAt: "2026-05-17T16:45:00Z",
    status: "disputed" as EscrowStatus,
    period: "Loyer mai 2026",
  },
  {
    id: "esc-005",
    propertyTitle: "Appartement 2 pièces - Fidjrossè",
    propertyAddress: "Cotonou, Bénin",
    amount: 123600,
    paidAt: "2026-05-24T11:00:00Z",
    releaseAt: "2026-05-31T11:00:00Z",
    status: "held" as EscrowStatus,
    period: "Loyer juin 2026",
  },
];

function statusBadge(status: EscrowStatus) {
  switch (status) {
    case "held":
      return (
        <Badge className="gap-1 bg-kaza-blue/10 text-kaza-blue hover:bg-kaza-blue/15">
          <Clock className="size-3" />
          En séquestre
        </Badge>
      );
    case "released":
      return (
        <Badge className="gap-1 bg-kaza-green text-white hover:bg-kaza-green/90">
          <ShieldCheck className="size-3" />
          Libéré
        </Badge>
      );
    case "disputed":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3" />
          En litige
        </Badge>
      );
  }
}

export default function EscrowPage() {
  const totalHeld = MOCK_ESCROW_PAYMENTS.filter(
    (p) => p.status === "held"
  ).reduce((sum, p) => sum + p.amount, 0);
  const totalReleased = MOCK_ESCROW_PAYMENTS.filter(
    (p) => p.status === "released"
  ).reduce((sum, p) => sum + p.amount, 0);
  const disputedCount = MOCK_ESCROW_PAYMENTS.filter(
    (p) => p.status === "disputed"
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

      {/* Liste des paiements en séquestre */}
      <div className="space-y-4">
        {MOCK_ESCROW_PAYMENTS.map((payment) => (
          <Card key={payment.id}>
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    {payment.propertyTitle}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {payment.propertyAddress} • {payment.period}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(payment.status)}
                  <p className="font-heading text-lg font-bold text-foreground">
                    {formatPrice(payment.amount)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <EscrowTimeline
                paidAt={payment.paidAt}
                releaseAt={payment.releaseAt}
                currentStatus={payment.status}
              />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
                <span>
                  Payé le{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(payment.paidAt)}
                  </span>
                </span>
                {payment.status === "held" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    Signaler un problème
                  </Button>
                )}
                {payment.status === "disputed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
                  >
                    Voir le litige
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
