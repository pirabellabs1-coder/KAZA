// =============================================================================
// KAZA — Admin / Codes promo (liste + création)
// Server Component. Lit tous les codes via `listPromoCodes`, affiche le
// formulaire de création (client) et un interrupteur actif/inactif par code.
// =============================================================================

import { Ticket } from "lucide-react";

import { listPromoCodes, type AdminPromoCode } from "@/actions/promo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatFcfa } from "@/lib/utils";

import { PromoCreateForm } from "./promo-create-form";
import { PromoToggle } from "./promo-toggle";

export const dynamic = "force-dynamic";

const SCOPE_LABELS: Record<AdminPromoCode["appliesTo"], string> = {
  ALL: "Tout",
  BOOST: "Boost",
  SUBSCRIPTION: "Abonnement",
  RESERVATION: "Réservation",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function discountLabel(code: AdminPromoCode): string {
  return code.discountType === "PERCENT"
    ? `-${code.discountValue} %`
    : `-${formatFcfa(code.discountValue)}`;
}

export default async function AdminPromoCodesPage() {
  const codes = await listPromoCodes();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Codes promo
        </h1>
        <p className="text-sm text-muted-foreground">
          Créez et gérez les codes de réduction utilisables par vos utilisateurs
          au moment du paiement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Création */}
        <div className="lg:order-2">
          <PromoCreateForm />
        </div>

        {/* Liste */}
        <div className="lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="size-4 text-kaza-blue" />
                {codes.length} code{codes.length > 1 ? "s" : ""} au total
              </CardTitle>
            </CardHeader>
            <CardContent>
              {codes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-kaza-blue/10">
                    <Ticket className="size-6 text-kaza-blue" />
                  </div>
                  <p className="text-base font-semibold text-kaza-navy">
                    Aucun code promo
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Créez votre premier code avec le formulaire ci-contre. Il
                    sera immédiatement actif.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Remise</TableHead>
                        <TableHead>Périmètre</TableHead>
                        <TableHead>Utilisations</TableHead>
                        <TableHead>Validité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {codes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm font-semibold text-kaza-navy">
                                {code.code}
                              </span>
                              {code.description && (
                                <span className="max-w-[220px] truncate text-xs text-muted-foreground">
                                  {code.description}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-kaza-navy">
                              {discountLabel(code)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-kaza-blue/30 bg-kaza-blue/5 text-xs font-semibold text-kaza-blue"
                            >
                              {SCOPE_LABELS[code.appliesTo]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {code.usedCount}
                              {code.maxUses != null ? ` / ${code.maxUses}` : " / ∞"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {code.validUntil
                                ? `jusqu'au ${formatDate(code.validUntil)}`
                                : "permanent"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-semibold",
                                code.isActive
                                  ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                  : "border-gray-200 bg-gray-100 text-gray-600",
                              )}
                            >
                              {code.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <PromoToggle
                              id={code.id}
                              code={code.code}
                              isActive={code.isActive}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
