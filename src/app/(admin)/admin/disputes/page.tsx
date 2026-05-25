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
import {
  StatusBadge,
  type StatusType,
} from "@/components/admin/status-badge";
import { cn } from "@/lib/utils";

type DisputeType = "Paiement" | "Visite" | "Annonce" | "Comportement";
type DisputeStatus = Extract<
  StatusType,
  "open" | "in_progress" | "resolved" | "closed"
>;

interface DisputeRow {
  id: string;
  type: DisputeType;
  plaintiff: string;
  defendant: string;
  status: DisputeStatus;
  openedAt: string;
  [key: string]: unknown;
}

const allDisputes: DisputeRow[] = [
  {
    id: "L-2103",
    type: "Paiement",
    plaintiff: "Aminata Sow",
    defendant: "Pierre Hounsou",
    status: "open",
    openedAt: "2026-05-24",
  },
  {
    id: "L-2102",
    type: "Annonce",
    plaintiff: "Karim Lawal",
    defendant: "Mariam Bio",
    status: "in_progress",
    openedAt: "2026-05-23",
  },
  {
    id: "L-2101",
    type: "Comportement",
    plaintiff: "Lucie Houessou",
    defendant: "Jean Sossa",
    status: "open",
    openedAt: "2026-05-22",
  },
  {
    id: "L-2100",
    type: "Visite",
    plaintiff: "Fatima Adjovi",
    defendant: "Eric Tchégoun",
    status: "resolved",
    openedAt: "2026-05-20",
  },
  {
    id: "L-2099",
    type: "Paiement",
    plaintiff: "Rose Akpovi",
    defendant: "Antoine Zinsou",
    status: "in_progress",
    openedAt: "2026-05-19",
  },
  {
    id: "L-2098",
    type: "Annonce",
    plaintiff: "Pascal Agbo",
    defendant: "Société KAZA Pro",
    status: "closed",
    openedAt: "2026-05-18",
  },
  {
    id: "L-2097",
    type: "Comportement",
    plaintiff: "Yvonne Dossou",
    defendant: "Karim Lawal",
    status: "resolved",
    openedAt: "2026-05-17",
  },
  {
    id: "L-2096",
    type: "Visite",
    plaintiff: "Sébastien Aho",
    defendant: "Moussa Adékambi",
    status: "open",
    openedAt: "2026-05-16",
  },
  {
    id: "L-2095",
    type: "Paiement",
    plaintiff: "Béatrice Codjia",
    defendant: "Pierre Hounsou",
    status: "resolved",
    openedAt: "2026-05-14",
  },
  {
    id: "L-2094",
    type: "Annonce",
    plaintiff: "Aminata Sow",
    defendant: "Mariam Bio",
    status: "closed",
    openedAt: "2026-05-12",
  },
];

const typeBadgeClasses: Record<DisputeType, string> = {
  Paiement: "bg-red-100 text-red-700 border-red-200",
  Visite: "bg-blue-100 text-blue-700 border-blue-200",
  Annonce: "bg-amber-100 text-amber-700 border-amber-200",
  Comportement: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function AdminDisputesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const rows = allDisputes.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    open: allDisputes.filter((d) => d.status === "open").length,
    inProgress: allDisputes.filter((d) => d.status === "in_progress").length,
    resolved30d: allDisputes.filter((d) => d.status === "resolved").length,
  };

  const columns: DataTableColumn<DisputeRow>[] = [
    {
      key: "id",
      label: "ID",
      sortValue: (row) => row.id,
      render: (row) => (
        <span className="font-mono text-xs font-medium text-kaza-navy">
          #{row.id}
        </span>
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
            typeBadgeClasses[row.type]
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
          onClick={() => console.log("view dispute", row.id)}
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
          trend={{ label: "+22% vs mois dernier", type: "positive" }}
        />
        <StatsCard
          title="Délai moyen"
          value="3,2 j"
          icon={Clock4}
          trend={{ label: "-0,4 j vs mois dernier", type: "positive" }}
        />
      </StatsGrid>

      <DataTable
        columns={columns}
        rows={rows}
        searchAccessor={(row) =>
          `${row.id} ${row.plaintiff} ${row.defendant} ${row.type}`
        }
        searchPlaceholder="Rechercher par ID, partie, type..."
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
    </div>
  );
}
