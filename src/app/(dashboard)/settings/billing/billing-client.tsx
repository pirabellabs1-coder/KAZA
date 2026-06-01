"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  CreditCard,
  Wallet,
  Building2,
  Receipt,
  Smartphone,
  ArrowUpRight,
} from "lucide-react";

import { updateBillingAddress } from "@/actions/settings";
import type { UserInvoice } from "@/lib/queries/subscriptions";
import { InvoiceDownloadButton } from "@/components/billing/invoice-download-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast-helper";

// Statuts de facture tels que stockés en DB (majuscules) → libellé + style.
const STATUS_META: Record<string, { label: string; className: string }> = {
  PAID: { label: "Payée", className: "bg-green-100 text-green-700" },
  PENDING: { label: "En attente", className: "bg-orange-100 text-orange-700" },
  FAILED: { label: "Échouée", className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Annulée", className: "bg-muted text-muted-foreground" },
};

function statusMeta(status: string) {
  return (
    STATUS_META[status?.toUpperCase()] ?? {
      label: status || "—",
      className: "bg-muted text-muted-foreground",
    }
  );
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

interface BillingClientProps {
  initialAddress?: Record<string, unknown>;
  invoices?: UserInvoice[];
  walletBalance?: number;
  walletHref?: string;
}

export function BillingClient({
  initialAddress = {},
  invoices = [],
  walletBalance = 0,
  walletHref = "/tenant/wallet",
}: BillingClientProps) {
  const [address, setAddress] = useState({
    name: readString(initialAddress.name),
    line1: readString(initialAddress.line1),
    city: readString(initialAddress.city),
    country: readString(initialAddress.country),
  });
  const [isSaving, startSaving] = useTransition();

  const saveAddress = () => {
    startSaving(async () => {
      const result = await updateBillingAddress(address);
      if (result.success) {
        toast.success("Adresse de facturation enregistrée.");
      } else {
        toast.error(
          result.error ?? "Impossible d'enregistrer l'adresse de facturation.",
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Moyens de paiement — KAZA Wallet + Mobile Money (pas de carte stockée) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-kaza-blue" />
            Moyens de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* KAZA Wallet */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-kaza-blue/10 text-kaza-blue">
              <Wallet className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                KAZA Wallet
                <Badge className="ml-2 bg-kaza-green/10 text-[10px] text-kaza-green">
                  Solde {formatPrice(walletBalance)}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                Réglez vos abonnements, boosts et frais directement depuis votre
                solde.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={walletHref}>
                Recharger
                <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Money */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-kaza-blue/10 text-kaza-blue">
              <Smartphone className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Mobile Money</p>
              <p className="text-xs text-muted-foreground">
                MTN, Moov et autres opérateurs. Le numéro est saisi de façon
                sécurisée au moment du paiement — rien n&apos;est stocké chez
                KAZA.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Au paiement
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Historique de facturation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4 text-kaza-blue" />
            Historique de facturation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10">
                <Receipt className="size-6 text-kaza-blue" />
              </div>
              <p className="mt-3 text-sm font-semibold text-kaza-navy">
                Aucune facture émise
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Vos quittances de loyer et factures KAZA s&apos;afficheront ici
                après la première transaction.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Référence</th>
                    <th className="px-3 py-2">Libellé</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                    <th className="px-3 py-2">Statut</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => {
                    const meta = statusMeta(inv.status);
                    return (
                      <tr key={inv.id}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatDate(inv.issuedAt)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {inv.number}
                        </td>
                        <td className="px-3 py-2">
                          {inv.description ?? "Service KAZA"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatPrice(inv.amount)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            className={`border-0 text-[10px] ${meta.className}`}
                          >
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <InvoiceDownloadButton invoice={inv} />
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

      {/* Adresse de facturation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-kaza-blue" />
            Adresse de facturation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bill-name">Nom complet / Raison sociale</Label>
              <Input
                id="bill-name"
                value={address.name}
                onChange={(e) =>
                  setAddress({ ...address, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-line1">Adresse</Label>
              <Input
                id="bill-line1"
                value={address.line1}
                onChange={(e) =>
                  setAddress({ ...address, line1: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-city">Ville</Label>
              <Input
                id="bill-city"
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bill-country">Pays</Label>
              <Input
                id="bill-country"
                value={address.country}
                onChange={(e) =>
                  setAddress({ ...address, country: e.target.value })
                }
              />
            </div>
          </div>
          <Separator />
          <Button onClick={saveAddress} disabled={isSaving} className="bg-kaza-navy">
            {isSaving ? "Enregistrement…" : "Enregistrer l'adresse"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
