import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listMyReports } from "@/lib/queries/reports-admin";
import {
  ReportsClient,
  type UserReport,
  type ReportTargetType,
  type ReportReason,
  type ReportStatus,
} from "./reports-client";

export const metadata: Metadata = {
  title: "Mes signalements",
  description:
    "Suivez l'avancement des contenus que vous avez signalés à l'équipe KAZA.",
};

// Mapping table `reports` (valeurs base) → vocabulaire de l'UI -----------------

const TARGET_TYPE_MAP: Record<string, ReportTargetType> = {
  property: "property",
  review: "review",
  user: "user",
  message: "message",
  other: "property",
};

const REASON_MAP: Record<string, ReportReason> = {
  fake: "fake",
  fraud: "scam",
  inappropriate: "inappropriate",
  spam: "spam",
  other: "other",
};

const STATUS_MAP: Record<string, ReportStatus> = {
  PENDING: "pending",
  REVIEWED: "reviewed",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
};

const TARGET_LABEL: Record<ReportTargetType, string> = {
  property: "Annonce signalée",
  user: "Utilisateur signalé",
  message: "Message signalé",
  review: "Avis signalé",
};

export default async function ReportsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/reports");

  const rows = await listMyReports(user.id);

  const reports: UserReport[] = rows.map((r) => {
    const targetType = TARGET_TYPE_MAP[r.targetType] ?? "property";
    const shortId = r.targetId ? ` #${r.targetId.slice(0, 8)}` : "";
    return {
      id: r.id,
      targetType,
      targetId: r.targetId ?? "—",
      targetLabel: `${TARGET_LABEL[targetType]}${shortId}`,
      reason: REASON_MAP[r.reason] ?? "other",
      description: r.details ?? "—",
      reporterId: r.reporterId ?? "",
      reportedAt: r.createdAt,
      status: STATUS_MAP[r.status] ?? "pending",
    };
  });

  return <ReportsClient reports={reports} />;
}
