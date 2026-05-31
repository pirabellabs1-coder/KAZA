"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/toast-helper";
import { formatPrice } from "@/lib/utils";

import { withdrawApplication } from "@/actions/applications";
import type { TenantApplication } from "@/lib/queries/applications";

const STATUS_META: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800", Icon: Clock },
  ACCEPTED: { label: "Acceptée", className: "bg-kaza-green/15 text-kaza-green", Icon: CheckCircle2 },
  REJECTED: { label: "Refusée", className: "bg-rose-100 text-rose-700", Icon: XCircle },
  WITHDRAWN: { label: "Retirée", className: "bg-slate-200 text-slate-600", Icon: Ban },
};

export function ApplicationsView({
  applications,
}: {
  applications: TenantApplication[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleWithdraw = (id: string) => {
    startTransition(async () => {
      const res = await withdrawApplication(id);
      if (res.success) {
        toast.success("Candidature retirée");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes candidatures
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez l&apos;état de vos candidatures envoyées aux propriétaires.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune candidature envoyée"
          description="Parcourez les annonces et postulez à un logement : le bouton « Postuler » se trouve sur chaque fiche bien."
          actionLabel="Voir les annonces"
          onAction={() => router.push("/search")}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((a) => {
            const meta = STATUS_META[a.status] ?? STATUS_META.PENDING;
            const Icon = meta.Icon;
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {a.propertyTitle}
                      </h3>
                      <Badge className={`gap-1 ${meta.className}`}>
                        <Icon className="size-3" />
                        {meta.label}
                      </Badge>
                    </div>
                    {a.propertyAddress ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{a.propertyAddress}</span>
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPrice(a.price)}/mois · Envoyée le{" "}
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                      {a.moveInDate
                        ? ` · Emménagement ${new Date(a.moveInDate).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/properties/${a.propertyId}`}>
                        <Eye className="size-3.5" /> Le bien
                      </Link>
                    </Button>
                    {a.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-rose-600 hover:text-rose-700"
                        disabled={isPending}
                        onClick={() => handleWithdraw(a.id)}
                      >
                        <Ban className="size-3.5" /> Retirer
                      </Button>
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
