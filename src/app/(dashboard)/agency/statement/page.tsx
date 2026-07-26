import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Banknote, PiggyBank, Receipt, Wallet } from "lucide-react";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getAgencyStatement } from "@/lib/queries/agency-statement";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataExportButtons } from "@/components/dashboard/data-export-buttons";
import { formatFcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Relevé de gestion — Kaabo Agence",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  RELEASED: {
    label: "Reversé",
    className: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },
  HELD: {
    label: "En séquestre",
    className: "border-amber-200 bg-amber-100 text-amber-800",
  },
  REFUNDED: {
    label: "Remboursé",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

export default async function AgencyStatementPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/agency/statement");

  const stmt = await getAgencyStatement(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
            Relevé de gestion
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Loyers encaissés via Kaabo pour vos biens gérés : montant brut,
            commission Kaabo prélevée et net reversé. Document de suivi comptable
            (données réelles).
          </p>
        </div>
        <DataExportButtons
          filename="kaabo-releve-gestion"
          rows={stmt.lines.map((l) => ({
            Date: fmtDate(l.date),
            Bien: l.propertyTitle,
            Locataire: l.tenantName,
            "Brut (FCFA)": l.gross,
            "Commission Kaabo (FCFA)": l.commission,
            "Net reversé (FCFA)": l.net,
            Statut: STATUS_BADGE[l.status]?.label ?? l.status,
          }))}
        />
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={Banknote}
          label="Encaissé (brut)"
          value={formatFcfa(stmt.totalCollected)}
        />
        <Metric
          icon={Receipt}
          label="Commission Kaabo"
          value={formatFcfa(stmt.totalCommission)}
          tone="muted"
        />
        <Metric
          icon={PiggyBank}
          label="Net reversé"
          value={formatFcfa(stmt.totalNet)}
          tone="green"
        />
        <Metric
          icon={Wallet}
          label="En séquestre"
          value={formatFcfa(stmt.totalPending)}
          tone="amber"
        />
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {stmt.lines.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Receipt className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun encaissement pour le moment. Les loyers réglés via Kaabo
                apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Bien</th>
                    <th className="px-4 py-3 font-medium">Locataire</th>
                    <th className="px-4 py-3 text-right font-medium">Brut</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Commission
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Net</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stmt.lines.map((l) => {
                    const badge = STATUS_BADGE[l.status] ?? {
                      label: l.status,
                      className: "border-slate-200 bg-slate-100 text-slate-700",
                    };
                    return (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">
                          {fmtDate(l.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-kaza-navy">
                          {l.propertyTitle}
                        </td>
                        <td className="px-4 py-3">{l.tenantName}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatFcfa(l.gross)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          −{formatFcfa(l.commission)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-kaza-green">
                          {formatFcfa(l.net)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
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

      <p className="text-xs text-muted-foreground">
        La commission Kaabo (2 % sur les loyers) est prélevée automatiquement à
        la libération de l&apos;escrow. Le net est reversé sur votre wallet
        Kaabo, retirable vers votre compte.
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  tone?: "green" | "amber" | "muted";
}) {
  const color =
    tone === "green"
      ? "text-kaza-green"
      : tone === "amber"
        ? "text-amber-600"
        : "text-kaza-navy";
  return (
    <div className="rounded-xl border bg-white p-4">
      <Icon className="size-4 text-kaza-blue" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-heading text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
