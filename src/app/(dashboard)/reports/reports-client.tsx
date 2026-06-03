"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  Gavel,
  HelpCircle,
  Megaphone,
  ShieldAlert,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// =============================================================================
// Types consommés par le composant (alimentés par la table `reports` côté
// serveur — voir reports/page.tsx qui mappe ReportSummary → UserReport).
// =============================================================================

export type ReportTargetType = "property" | "user" | "message" | "review";

export type ReportReason =
  | "inappropriate"
  | "spam"
  | "scam"
  | "fake"
  | "harassment"
  | "illegal"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface UserReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  description: string;
  reporterId: string;
  reportedAt: string;
  status: ReportStatus;
  adminNote?: string;
}

const REASON_META: Record<
  ReportReason,
  { label: string; description: string; iconName: string }
> = {
  inappropriate: {
    label: "Contenu inapproprié",
    description: "Images, textes ou commentaires choquants ou offensants.",
    iconName: "AlertTriangle",
  },
  spam: {
    label: "Spam",
    description: "Sollicitations commerciales ou contenu répétitif.",
    iconName: "Megaphone",
  },
  scam: {
    label: "Arnaque",
    description: "Tentative de fraude, prix suspects, faux loyer.",
    iconName: "ShieldAlert",
  },
  fake: {
    label: "Faux profil / fausse annonce",
    description: "Information mensongère, photos volées, identité usurpée.",
    iconName: "UserX",
  },
  harassment: {
    label: "Harcèlement",
    description: "Messages insistants, menaces ou intimidations.",
    iconName: "AlertCircle",
  },
  illegal: {
    label: "Activité illégale",
    description: "Violation de la loi, contenu interdit, trafic.",
    iconName: "Gavel",
  },
  other: {
    label: "Autre motif",
    description: "Précisez le contexte dans la description.",
    iconName: "HelpCircle",
  },
};

const STATUS_META: Record<
  ReportStatus,
  { label: string; classes: string; iconName: string }
> = {
  pending: {
    label: "En attente",
    classes: "bg-kaza-warning/15 text-kaza-warning border-kaza-warning/30",
    iconName: "Clock",
  },
  reviewed: {
    label: "Examiné",
    classes: "bg-kaza-blue/15 text-kaza-blue border-kaza-blue/30",
    iconName: "Eye",
  },
  resolved: {
    label: "Résolu",
    classes: "bg-kaza-green/15 text-kaza-green border-kaza-green/30",
    iconName: "CheckCircle2",
  },
  dismissed: {
    label: "Rejeté",
    classes: "bg-muted text-muted-foreground border-border",
    iconName: "XCircle",
  },
};

const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  property: "Annonce",
  user: "Utilisateur",
  message: "Message",
  review: "Avis",
};

function formatReportDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const REASON_ICON: Record<string, LucideIcon> = {
  AlertTriangle,
  Megaphone,
  ShieldAlert,
  UserX,
  AlertCircle,
  Gavel,
  HelpCircle,
};

const STATUS_ICON: Record<string, LucideIcon> = {
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
};

const TAB_VALUES = ["all", "pending", "reviewed", "resolved"] as const;
type TabValue = (typeof TAB_VALUES)[number];

const TAB_LABELS: Record<TabValue, string> = {
  all: "Tous",
  pending: "En attente",
  reviewed: "Examinés",
  resolved: "Résolus",
};

const TAB_STATUS_FILTER: Record<TabValue, ReportStatus[] | null> = {
  all: null,
  pending: ["pending"],
  reviewed: ["reviewed"],
  resolved: ["resolved", "dismissed"],
};

export function ReportsClient({ reports }: { reports: UserReport[] }) {
  const [tab, setTab] = useState<TabValue>("all");
  const [detail, setDetail] = useState<UserReport | null>(null);

  const counts = useMemo(() => {
    return {
      all: reports.length,
      pending: reports.filter((r) => r.status === "pending").length,
      reviewed: reports.filter((r) => r.status === "reviewed").length,
      resolved: reports.filter(
        (r) => r.status === "resolved" || r.status === "dismissed",
      ).length,
    } satisfies Record<TabValue, number>;
  }, [reports]);

  const filtered = useMemo(() => {
    const filter = TAB_STATUS_FILTER[tab];
    if (!filter) return reports;
    return reports.filter((r) => filter.includes(r.status));
  }, [reports, tab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          <Flag className="mr-2 inline size-7 text-destructive" />
          Mes signalements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez l&apos;avancement des contenus que vous avez signalés.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
          {TAB_VALUES.map((value) => (
            <TabsTrigger key={value} value={value}>
              {TAB_LABELS[value]}
              <Badge
                variant="secondary"
                className="ml-2 px-1.5 py-0 text-[10px]"
              >
                {counts[value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_VALUES.map((value) => (
          <TabsContent key={value} value={value} className="mt-4">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-4">
                  <EmptyState
                    icon={Flag}
                    title="Aucun signalement"
                    description={
                      value === "all"
                        ? "Vous n'avez encore signalé aucun contenu. Utilisez le bouton « Signaler » présent sur les annonces, messages et profils."
                        : `Aucun signalement dans la catégorie « ${TAB_LABELS[value]} » pour le moment.`
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filtered.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onOpen={() => setDetail(report)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog détails */}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="size-5 text-destructive" />
                  Détail du signalement
                </DialogTitle>
                <DialogDescription>
                  Référence : <code className="text-xs">{detail.id}</code>
                </DialogDescription>
              </DialogHeader>
              <ReportDetail report={detail} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportCard({
  report,
  onOpen,
}: {
  report: UserReport;
  onOpen: () => void;
}) {
  const reasonMeta = REASON_META[report.reason];
  const statusMeta = STATUS_META[report.status];
  const ReasonIcon = REASON_ICON[reasonMeta.iconName] ?? HelpCircle;
  const StatusIcon = STATUS_ICON[statusMeta.iconName] ?? Clock;

  return (
    <Card className="transition hover:border-kaza-blue/40 hover:shadow-sm">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <ReasonIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {TARGET_TYPE_LABELS[report.targetType]}
            </Badge>
            <p className="font-semibold text-foreground">{report.targetLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", statusMeta.classes)}
            >
              <StatusIcon className="mr-1 inline size-3" />
              {statusMeta.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {reasonMeta.label}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {report.description}
          </p>
          <p className="text-xs text-muted-foreground">
            Signalé le {formatReportDate(report.reportedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpen}
            className="text-kaza-blue hover:text-kaza-blue"
          >
            Détails
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportDetail({ report }: { report: UserReport }) {
  const reasonMeta = REASON_META[report.reason];
  const statusMeta = STATUS_META[report.status];
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Cible
        </p>
        <p className="font-medium">{report.targetLabel}</p>
        <p className="text-xs text-muted-foreground">
          {TARGET_TYPE_LABELS[report.targetType]} · ID {report.targetId}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Raison
          </p>
          <p className="font-medium">{reasonMeta.label}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Statut
          </p>
          <Badge variant="outline" className={cn("text-xs", statusMeta.classes)}>
            {statusMeta.label}
          </Badge>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Description
        </p>
        <p className="mt-1 whitespace-pre-line rounded-md bg-muted/40 p-3 text-sm">
          {report.description}
        </p>
      </div>

      {report.adminNote && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Note de l&apos;équipe KAZA
          </p>
          <p className="mt-1 whitespace-pre-line rounded-md border border-kaza-blue/30 bg-kaza-blue/5 p-3 text-sm">
            {report.adminNote}
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Signalé le {formatReportDate(report.reportedAt)}
      </p>
    </div>
  );
}
