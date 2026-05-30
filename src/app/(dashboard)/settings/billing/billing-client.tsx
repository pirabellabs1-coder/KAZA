"use client";

import { useState } from "react";
import { CreditCard, Plus, Wallet, Building2, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast-helper";

interface PaymentMethod {
  id: string;
  type: "card" | "wallet";
  label: string;
  detail: string;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}

// Tant que la query `listUserPaymentMethods` / `listUserInvoices` n'est pas
// branchée côté serveur, on initialise tout à vide et on affiche des empty
// states honnêtes (cartes / factures réelles uniquement).
const DEFAULT_METHODS: PaymentMethod[] = [];

const INVOICES: Invoice[] = [];

const STATUS_META: Record<
  Invoice["status"],
  { label: string; className: string }
> = {
  paid: { label: "Payée", className: "bg-green-100 text-green-700" },
  pending: { label: "En attente", className: "bg-orange-100 text-orange-700" },
  failed: { label: "Échouée", className: "bg-red-100 text-red-700" },
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function BillingClient() {
  const [methods, setMethods] = useState<PaymentMethod[]>(DEFAULT_METHODS);
  const [address, setAddress] = useState({
    name: "",
    line1: "",
    city: "",
    country: "",
  });

  const setDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id })),
    );
    toast.success("Méthode de paiement par défaut mise à jour.");
  };

  const remove = (id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    toast.info("Méthode de paiement supprimée.");
  };

  const addMethod = () => {
    toast.info(
      "L'ajout d'une méthode de paiement sera disponible prochainement.",
    );
  };

  const saveAddress = () => {
    toast.success("Adresse de facturation enregistrée.");
  };

  const downloadInvoice = (id: string) => {
    toast.info(`Le téléchargement de la facture ${id} sera bientôt disponible.`);
  };

  return (
    <div className="space-y-6">
      {/* Méthodes de paiement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-kaza-blue" />
            Méthodes de paiement
          </CardTitle>
          <Button size="sm" onClick={addMethod} className="bg-kaza-blue hover:bg-kaza-blue/90">
            <Plus className="mr-1 size-3.5" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {methods.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucune méthode enregistrée.
            </p>
          ) : (
            methods.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-kaza-blue/10 text-kaza-blue">
                  {m.type === "card" ? (
                    <CreditCard className="size-5" />
                  ) : (
                    <Wallet className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {m.label}
                    {m.isDefault ? (
                      <Badge className="ml-2 bg-kaza-green/10 text-[10px] text-kaza-green">
                        Par défaut
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.detail}</p>
                </div>
                <div className="flex gap-2">
                  {!m.isDefault ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefault(m.id)}
                    >
                      Définir par défaut
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(m.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))
          )}
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
          {INVOICES.length === 0 ? (
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
            <div className="overflow-hidden rounded-lg border">
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
                  {INVOICES.map((inv) => {
                    const meta = STATUS_META[inv.status];
                    return (
                      <tr key={inv.id}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(inv.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{inv.id}</td>
                        <td className="px-3 py-2">{inv.label}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatPrice(inv.amount)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`border-0 text-[10px] ${meta.className}`}>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadInvoice(inv.id)}
                            className="text-kaza-blue"
                          >
                            PDF
                          </Button>
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
          <Button onClick={saveAddress} className="bg-kaza-navy">
            Enregistrer l&apos;adresse
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
