import type { Metadata } from "next";
import {
  IdCard,
  Clock,
  CheckCircle2,
  TimerReset,
  XCircle,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { listAllIdentityVerifications } from "@/lib/queries/admin";

import { VerificationsClient } from "./verifications-client";

export const metadata: Metadata = {
  title: "Vérifications d'identité — Admin Kaabo",
  description:
    "Modération des dossiers KYC : pièces d'identité, justificatifs et selfies.",
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-kaza-navy">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-xl",
            accent,
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

function relativeFromIso(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

function averageReviewHours(rows: Array<{ submittedAt: string; reviewedAt: string | null }>): number | null {
  const reviewed = rows.filter((r) => r.reviewedAt);
  if (reviewed.length === 0) return null;
  const sum = reviewed.reduce((acc, r) => {
    const delta = new Date(r.reviewedAt!).getTime() - new Date(r.submittedAt).getTime();
    return acc + delta;
  }, 0);
  return Math.round(sum / reviewed.length / 3_600_000);
}

export default async function AdminVerificationsPage() {
  const allVerifications = await listAllIdentityVerifications();

  const pending = allVerifications.filter((v) => v.status === "PENDING");
  const approved = allVerifications.filter((v) => v.status === "APPROVED");
  const rejected = allVerifications.filter((v) => v.status === "REJECTED");

  const avgHours = averageReviewHours(allVerifications);
  const reviewedTotal = approved.length + rejected.length;
  const approvalRate =
    reviewedTotal > 0 ? Math.round((approved.length / reviewedTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Vérifications d&apos;identité
        </h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} dossier{pending.length > 1 ? "s" : ""} en attente · validez ou
          rejetez les pièces soumises par les utilisateurs
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="En attente"
          value={String(pending.length)}
          hint="dossiers à traiter"
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          icon={TimerReset}
          label="Délai moyen"
          value={avgHours !== null ? `${avgHours} h` : "—"}
          hint="temps de traitement"
          accent="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={CheckCircle2}
          label="Taux d'approbation"
          value={reviewedTotal > 0 ? `${approvalRate} %` : "—"}
          hint={
            reviewedTotal > 0
              ? `${approved.length} / ${reviewedTotal} approuvés`
              : "aucun dossier traité"
          }
          accent="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={ShieldCheck}
          label="Total soumis"
          value={String(allVerifications.length)}
          hint="depuis le lancement"
          accent="bg-kaza-navy/10 text-kaza-navy"
        />
      </section>

      {/* Interactive tabs + queue */}
      <VerificationsClient
        pending={pending.map(serialize)}
        approved={approved.map(serialize)}
        rejected={rejected.map(serialize)}
      />

      {/* Empty state — affiché si tout est vide */}
      {allVerifications.length === 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <IdCard className="mx-auto size-10 text-muted-foreground/50" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-kaza-navy">
            Aucune vérification soumise
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Les demandes apparaîtront ici dès qu&apos;un utilisateur soumettra ses
            pièces.
          </p>
        </section>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Badge className="border-amber-200 bg-amber-100 text-amber-700">
          PENDING
        </Badge>
        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
          APPROVED
        </Badge>
        <Badge className="border-red-200 bg-red-100 text-red-700">
          REJECTED
        </Badge>
        <span className="ml-2 flex items-center gap-1">
          <XCircle className="size-3.5" /> Les URLs des pièces expirent après 10 min
          (bucket privé).
        </span>
      </div>
    </div>
  );
}

// Sérialisation pour le passage server → client (ajoute une date pré-formatée).
function serialize(v: Awaited<ReturnType<typeof listAllIdentityVerifications>>[number]) {
  return {
    id: v.id,
    userId: v.userId,
    userName: v.userName,
    userEmail: v.userEmail,
    documentType: v.documentType,
    documentNumber: v.documentNumber,
    phoneNumber: v.phoneNumber,
    status: v.status,
    submittedAt: v.submittedAt,
    submittedRelative: relativeFromIso(v.submittedAt),
    reviewedAt: v.reviewedAt,
    reviewedRelative: relativeFromIso(v.reviewedAt),
    reviewerNotes: v.reviewerNotes,
    documentFrontUrl: v.documentFrontUrl,
    documentBackUrl: v.documentBackUrl,
    selfieUrl: v.selfieUrl,
  };
}

export type AdminVerificationItem = ReturnType<typeof serialize>;
