"use client";

import { useState } from "react";
import {
  AlertOctagon,
  Timer,
  CheckCircle2,
  Clock4,
  Eye,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatsGrid } from "@/components/admin/stats-grid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn, formatFcfaShort } from "@/lib/utils";
import type {
  AdminDisputeRow,
  AdminDisputeType,
} from "@/lib/queries/admin-disputes";

const typeBadgeClasses: Record<AdminDisputeType, string> = {
  Paiement: "bg-red-100 text-red-700 border-red-200",
  Visite: "bg-blue-100 text-blue-700 border-blue-200",
  Annonce: "bg-amber-100 text-amber-700 border-amber-200",
  Comportement: "bg-purple-100 text-purple-700 border-purple-200",
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function DisputesView({
  initialDisputes,
}: {
  initialDisputes: AdminDisputeRow[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AdminDisputeRow | null>(null);

  const rows = initialDisputes.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    return true;
  });

  // Délai moyen de résolution (jours) sur les litiges résolus.
  const resolved = initialDisputes.filter(
    (d) => d.resolvedAt && (d.status === "resolved" || d.status === "closed"),
  );
  const avgDays =
    resolved.length > 0
      ? Math.round(
          resolved.reduce(
            (acc, d) =>
              acc +
              (new Date(d.resolvedAt!).getTime() -
                new Date(d.openedAt).getTime()) /
                MS_PER_DAY,
            0,
          ) / resolved.length,
        )
      : null;

  const thirtyDaysAgo = Date.now() - 30 * MS_PER_DAY;
  const stats = {
    open: initialDisputes.filter((d) => d.status === "open").length,
    inProgress: initialDisputes.filter((d) => d.status === "in_progress").length,
    resolved30d: resolved.filter(
      (d) => new Date(d.resolvedAt!).getTime() >= thirtyDaysAgo,
    ).length,
  };

  const columns: DataTableColumn<AdminDisputeRow>[] = [
    {
      key: "id",
      label: "Réf.",
      sortValue: (row) => row.id,
      render: (row) => (
        <span className="font-mono text-xs font-medium text-kaza-navy">
          #{row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "title",
      label: "Objet",
      sortValue: (row) => row.title,
      render: (row) => (
        <span className="text-sm font-medium text-foreground">{row.title}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortValue: (row) => row.type,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            typeBadgeClasses[row.type],
          )}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: "plaintiff",
      label: "Plaignant",
      sortValue: (row) => row.plaintiff,
      render: (row) => <span className="text-sm">{row.plaintiff}</span>,
    },
    {
      key: "defendant",
      label: "Mis en cause",
      sortValue: (row) => row.defendant,
      render: (row) => <span className="text-sm">{row.defendant}</span>,
    },
    {
      key: "status",
      label: "Statut",
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "openedAt",
      label: "Ouvert le",
      sortValue: (row) => row.openedAt,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.openedAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => setSelected(row)}
        >
          <Eye className="size-4" />
          Détails
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Litiges & signalements
        </h1>
        <p className="text-sm text-muted-foreground">
          Suivez et résolvez les conflits entre utilisateurs de la plateforme.
        </p>
      </div>

      {/* Stats */}
      <StatsGrid cols={4}>
        <StatsCard
          title="Litiges ouverts"
          value={stats.open}
          icon={AlertOctagon}
          trend={{ label: "À traiter", type: "neutral" }}
        />
        <StatsCard
          title="En traitement"
          value={stats.inProgress}
          icon={Timer}
          trend={{ label: "Suivi actif", type: "neutral" }}
        />
        <StatsCard
          title="Résolus 30j"
          value={stats.resolved30d}
          icon={CheckCircle2}
          trend={{ label: "Sur la période", type: "neutral" }}
        />
        <StatsCard
          title="Délai moyen"
          value={avgDays !== null ? `${avgDays} j` : "—"}
          icon={Clock4}
          trend={{
            label: avgDays !== null ? "De résolution" : "Aucune donnée",
            type: "neutral",
          }}
        />
      </StatsGrid>

      <DataTable
        columns={columns}
        rows={rows}
        searchAccessor={(row) =>
          `${row.id} ${row.title} ${row.plaintiff} ${row.defendant} ${row.type}`
        }
        searchPlaceholder="Rechercher par réf., objet, partie, type..."
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En traitement</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Clos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Paiement">Paiement</SelectItem>
                <SelectItem value="Visite">Visite</SelectItem>
                <SelectItem value="Annonce">Annonce</SelectItem>
                <SelectItem value="Comportement">Comportement</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="Aucun litige"
        emptyDescription="Aucun litige ne correspond à ces filtres."
      />

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Litige #{selected?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              Détails du signalement enregistré sur la plateforme.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Objet</dt>
              <dd className="col-span-2 font-medium text-kaza-navy">
                {selected.title}
              </dd>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="col-span-2 font-medium text-kaza-navy">
                {selected.type}
              </dd>
              <dt className="text-muted-foreground">Plaignant</dt>
              <dd className="col-span-2 font-medium text-kaza-navy">
                {selected.plaintiff}
              </dd>
              <dt className="text-muted-foreground">Mis en cause</dt>
              <dd className="col-span-2 font-medium text-kaza-navy">
                {selected.defendant}
              </dd>
              {selected.amountFcfa != null && (
                <>
                  <dt className="text-muted-foreground">Montant</dt>
                  <dd className="col-span-2 font-medium text-kaza-navy">
                    {formatFcfaShort(selected.amountFcfa)}
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">Statut</dt>
              <dd className="col-span-2">
                <StatusBadge status={selected.status} />
              </dd>
              <dt className="text-muted-foreground">Ouvert le</dt>
              <dd className="col-span-2 font-medium text-kaza-navy">
                {new Date(selected.openedAt).toLocaleDateString("fr-FR")}
              </dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
