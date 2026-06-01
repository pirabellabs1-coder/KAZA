import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Clock, CheckCircle2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import {
  listAllVisitRequests,
  type AdminVisitStatus,
} from "@/lib/queries/admin-visits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demandes de visite — KAZA Admin",
  description:
    "Supervision des demandes de visite : visiteur, bien, propriétaire, statut.",
};

const STATUS_META: Record<AdminVisitStatus, { label: string; cls: string }> = {
  PENDING: { label: "En attente", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmée", cls: "bg-kaza-green/15 text-kaza-green" },
  CANCELLED: { label: "Annulée", cls: "bg-gray-100 text-gray-600" },
  COMPLETED: { label: "Effectuée", cls: "bg-slate-200 text-slate-700" },
  NO_SHOW: { label: "Absent", cls: "bg-rose-100 text-rose-700" },
};

export default async function AdminVisitsPage() {
  const { visits, total, pending, confirmed } = await listAllVisitRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
          Demandes de visite
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supervision de toutes les visites planifiées sur la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarCheck} label="Total" value={total} />
        <StatCard icon={Clock} label="En attente" value={pending} />
        <StatCard icon={CheckCircle2} label="Confirmées" value={confirmed} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toutes les demandes</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucune demande de visite pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Bien</th>
                    <th className="px-2 py-2">Visiteur</th>
                    <th className="px-2 py-2">Propriétaire</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => {
                    const meta = STATUS_META[v.status] ?? STATUS_META.PENDING;
                    return (
                      <tr key={v.id} className="border-b last:border-0">
                        <td className="px-2 py-2">
                          <Link
                            href={`/properties/${v.propertyId}`}
                            className="font-medium text-kaza-navy hover:underline"
                          >
                            {v.propertyTitle}
                          </Link>
                          {v.propertyAddress && (
                            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" /> {v.propertyAddress}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <span className="font-medium text-foreground">
                            {v.visitorName}
                          </span>
                          {v.visitorEmail && (
                            <span className="block text-xs text-muted-foreground">
                              {v.visitorEmail}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {v.ownerName}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {new Date(v.date).toLocaleDateString("fr-FR")} ·{" "}
                          {v.time}
                        </td>
                        <td className="px-2 py-2">
                          <Badge className={meta.cls}>{meta.label}</Badge>
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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-kaza-blue/10">
          <Icon className="size-5 text-kaza-blue" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-heading text-xl font-bold text-kaza-navy">
            {formatNumber(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
