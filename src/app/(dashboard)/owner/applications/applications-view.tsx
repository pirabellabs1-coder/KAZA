"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Coins,
  CalendarDays,
  Eye,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/toast-helper";
import { formatFcfa } from "@/lib/utils";

import { decideApplication } from "@/actions/applications";
import type { OwnerApplication } from "@/lib/queries/applications";

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  ACCEPTED: { label: "Acceptée", className: "bg-kaza-green/15 text-kaza-green" },
  REJECTED: { label: "Refusée", className: "bg-rose-100 text-rose-700" },
  WITHDRAWN: { label: "Retirée", className: "bg-slate-200 text-slate-600" },
};

export function OwnerApplicationsView({
  applications,
}: {
  applications: OwnerApplication[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const pending = applications.filter((a) => a.status === "PENDING");
  const decided = applications.filter((a) => a.status !== "PENDING");

  const decide = (id: string, status: "ACCEPTED" | "REJECTED") => {
    startTransition(async () => {
      const res = await decideApplication(id, status);
      if (res.success) {
        toast.success(status === "ACCEPTED" ? "Candidature acceptée" : "Candidature refusée");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  const renderCard = (a: OwnerApplication, withActions: boolean) => {
    const meta = STATUS_META[a.status] ?? STATUS_META.PENDING;
    return (
      <Card key={a.id}>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {a.tenantName}
                <span className="ml-2 font-normal text-muted-foreground">
                  → {a.propertyTitle}
                </span>
              </h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {a.tenantEmail ? (
                  <a
                    href={`mailto:${a.tenantEmail}`}
                    className="flex items-center gap-1 hover:text-kaza-navy"
                  >
                    <Mail className="size-3" /> {a.tenantEmail}
                  </a>
                ) : null}
                {a.monthlyIncome != null ? (
                  <span className="flex items-center gap-1">
                    <Coins className="size-3" /> {formatFcfa(a.monthlyIncome)}/mois
                  </span>
                ) : null}
                {a.moveInDate ? (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {new Date(a.moveInDate).toLocaleDateString("fr-FR")}
                  </span>
                ) : null}
              </div>
            </div>
            <Badge className={meta.className}>{meta.label}</Badge>
          </div>

          {a.message ? (
            <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
              {a.message}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/properties/${a.propertyId}`}>
                <Eye className="size-3.5" /> Voir le bien
              </Link>
            </Button>
            {withActions && a.status === "PENDING" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-rose-600 hover:text-rose-700"
                  disabled={isPending}
                  onClick={() => decide(a.id, "REJECTED")}
                >
                  <XCircle className="size-3.5" /> Refuser
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={isPending}
                  onClick={() => decide(a.id, "ACCEPTED")}
                >
                  <CheckCircle2 className="size-3.5" /> Accepter
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Candidatures reçues
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acceptez ou refusez les candidats à vos logements.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune candidature reçue"
          description="Les candidatures envoyées par les locataires sur vos annonces apparaîtront ici."
        />
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="size-3.5" /> En attente ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="decided">
              Traitées ({decided.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune candidature en attente.
              </p>
            ) : (
              pending.map((a) => renderCard(a, true))
            )}
          </TabsContent>
          <TabsContent value="decided" className="mt-4 space-y-3">
            {decided.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune candidature traitée.
              </p>
            ) : (
              decided.map((a) => renderCard(a, false))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
