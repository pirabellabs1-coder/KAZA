import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, Percent, TrendingUp, Handshake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { computeAgencyCommissions } from "@/lib/queries/agency-b2b";
import { formatFcfa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Commissions — KAZA Pro",
  description:
    "Estimation de vos commissions mensuelles à partir de vos mandats actifs.",
};

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

export default async function AgencyCommissionsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const data = await computeAgencyCommissions(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Commissions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimation calculée à partir de vos mandats <strong>actifs</strong> :
          loyer du bail en cours (ou prix affiché à défaut) × taux de commission.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="size-4 text-kaza-green" />
              Commission mensuelle estimée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(data.totalMonthlyCommission)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="size-4 text-kaza-blue" />
              Projection annuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {formatFcfa(data.totalAnnualCommission)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Handshake className="size-4 text-kaza-blue" />
              Mandats actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold text-kaza-navy">
              {data.activeMandates}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.lines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-green/10">
              <Coins className="size-7 text-kaza-green" aria-hidden="true" />
            </div>
            <p className="font-heading text-lg font-semibold text-kaza-navy">
              Aucune commission à estimer
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Activez des mandats avec un taux de commission et un bien associé
              pour voir vos commissions estimées ici.
            </p>
            <Button asChild className="mt-2">
              <Link href="/agency/mandates">Gérer mes mandats</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail par mandat</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mandant</TableHead>
                    <TableHead>Bien</TableHead>
                    <TableHead className="text-right">Base mensuelle</TableHead>
                    <TableHead className="text-center">Taux</TableHead>
                    <TableHead className="text-right">Commission / mois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lines.map((l) => (
                    <TableRow key={l.mandateId}>
                      <TableCell className="font-medium">{l.ownerName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {l.propertyTitle}
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase"
                          >
                            {l.basis === "ACTIVE_RENT" ? "Loyer réel" : "Prix affiché"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFcfa(l.monthlyBase)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-0.5">
                          {l.commissionRate}
                          <Percent className="size-3" />
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-kaza-green">
                        {formatFcfa(l.monthlyCommission)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
