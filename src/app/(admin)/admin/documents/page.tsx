import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileCheck2,
  FileText,
  Files,
  HardDrive,
  IdCard,
  Lock,
  MapPin,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatNumber } from "@/lib/utils";

import {
  listAllIdentityVerifications,
  type AdminDocumentRow,
  type AdminUserVerification,
} from "@/lib/queries/admin";

import { DocumentModActions } from "./document-mod-actions";
import { GdprRequestActions } from "./gdpr-request-actions";
import { listGdprRequests } from "@/lib/queries/gdpr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documents & RGPD — Kaabo Admin",
  description:
    "Modération des documents utilisateurs, gestion RGPD et conformité APDP.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: "Carte d'identité",
  passport: "Passeport",
  driver_license: "Permis de conduire",
  voter_card: "Carte d'électeur",
};

const DOC_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  national_id: IdCard,
  passport: IdCard,
  driver_license: IdCard,
  voter_card: FileCheck2,
};

const DOC_STATUS_BADGE: Record<
  AdminUserVerification,
  { label: string; classes: string }
> = {
  PENDING: {
    label: "À revoir",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "Approuvé",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Rejeté",
    classes: "bg-red-100 text-red-700 border-red-200",
  },
  UNVERIFIED: {
    label: "Non vérifié",
    classes: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const GDPR_TYPE_LABELS: Record<string, string> = {
  EXPORT: "Export des données",
  DELETION: "Suppression du compte",
  RECTIFICATION: "Rectification",
  ACCESS: "Accès aux données",
};

const GDPR_STATUS_BADGE: Record<
  string,
  { label: string; classes: string }
> = {
  PENDING: { label: "En attente", classes: "bg-amber-100 text-amber-700 border-amber-200" },
  IN_PROGRESS: { label: "En traitement", classes: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED: { label: "Traitée", classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Rejetée", classes: "bg-red-100 text-red-700 border-red-200" },
};

function DocStatusPill({ status }: { status: AdminUserVerification }) {
  const cfg = DOC_STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

function getDocLabel(type: string): string {
  return DOC_TYPE_LABELS[type] ?? type;
}

function getDocIcon(type: string): React.ComponentType<{ className?: string }> {
  return DOC_TYPE_ICON[type] ?? FileText;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: "amber" | "red" | "green" | "blue" | "slate";
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-start gap-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            accent ? colorMap[accent] : "bg-kaza-navy/10 text-kaza-navy"
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold text-kaza-navy">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDocumentsPage() {
  const documents = await listAllIdentityVerifications();

  const docCounts = documents.reduce(
    (acc, d) => {
      acc.total += 1;
      if (d.status === "PENDING") acc.pending += 1;
      if (d.status === "APPROVED") acc.approved += 1;
      if (d.status === "REJECTED") acc.rejected += 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 },
  );

  // Stats par type de document (taux d'approbation)
  const byType: Record<string, { total: number; approved: number }> = {};
  for (const d of documents) {
    if (!byType[d.documentType]) {
      byType[d.documentType] = { total: 0, approved: 0 };
    }
    byType[d.documentType]!.total += 1;
    if (d.status === "APPROVED") byType[d.documentType]!.approved += 1;
  }
  const verificationStats = Object.entries(byType).map(([type, v]) => ({
    type,
    approvalRate: v.total > 0 ? Math.round((v.approved / v.total) * 100) : 0,
    total: v.total,
  }));

  // Demandes RGPD/APDP réelles (table gdpr_requests). Échéance légale de
  // réponse = 30 jours après la demande (calcul du daysLeft fait au rendu).
  const gdprRows = await listGdprRequests();
  const gdprRequests = gdprRows.map((r) => ({
    id: r.id,
    type: r.type,
    userId: r.userId ?? "",
    userName: r.userName,
    requestedAt: r.requestedAt,
    status: r.status,
    deadline: new Date(
      new Date(r.requestedAt).getTime() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Documents &amp; RGPD
        </h1>
        <p className="text-sm text-muted-foreground">
          {docCounts.total} documents · {docCounts.pending} en attente de revue
          · {gdprRequests.length} demandes RGPD
        </p>
      </div>

      {/* RGPD requests — branché sur la table réelle `gdpr_requests` */}
      <Card className="rounded-2xl border-blue-200 bg-blue-50/40 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Scale className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Demandes RGPD / APDP
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Droits des utilisateurs : accès, rectification, effacement,
              portabilité
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {gdprRequests.length === 0 && (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white/60 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune demande RGPD en attente. Les demandes d&apos;accès, de
              rectification ou de suppression soumises par les utilisateurs
              apparaîtront ici.
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {gdprRequests.map((r) => {
              const statusCfg =
                GDPR_STATUS_BADGE[r.status] ?? GDPR_STATUS_BADGE.PENDING!;
              // Server Component rendu à chaque requête (force-dynamic).
              // eslint-disable-next-line react-hooks/purity
              const now = Date.now();
              const daysLeft = Math.ceil(
                (new Date(r.deadline).getTime() - now) /
                  (1000 * 60 * 60 * 24),
              );
              const overdue = daysLeft < 0;
              const urgent = daysLeft >= 0 && daysLeft <= 7;
              return (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {GDPR_TYPE_LABELS[r.type] ?? r.type}
                      </Badge>
                      <p className="font-medium text-kaza-navy">
                        <Link
                          href={`/admin/users/${r.userId}`}
                          className="hover:underline"
                        >
                          {r.userName}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Demandée le{" "}
                        {new Date(r.requestedAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.classes}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                      overdue
                        ? "bg-red-50 text-red-700"
                        : urgent
                          ? "bg-amber-50 text-amber-700"
                          : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Clock className="size-3" />
                    {overdue
                      ? `En retard de ${Math.abs(daysLeft)} jours`
                      : `Échéance dans ${daysLeft} jours`}{" "}
                    · {new Date(r.deadline).toLocaleDateString("fr-FR")}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <GdprRequestActions
                      request={{
                        id: r.id,
                        typeLabel: GDPR_TYPE_LABELS[r.type] ?? r.type,
                        userName: r.userName,
                        requestedAt: r.requestedAt,
                        deadline: r.deadline,
                        statusLabel: statusCfg.label,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-blue-100/60 px-3 py-2 text-xs text-blue-900">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Conformité :</strong> vous devez répondre dans les 30
              jours (RGPD art. 12 &amp; loi APDP du Bénin). Au-delà, des
              sanctions pécuniaires s&apos;appliquent.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Files}
          label="Total documents"
          value={formatNumber(docCounts.total)}
          hint="Vérifications d'identité"
          accent="blue"
        />
        <StatCard
          icon={Clock}
          label="En attente revue"
          value={String(docCounts.pending)}
          hint="À traiter en priorité"
          accent="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approuvés"
          value={String(docCounts.approved)}
          hint="Vérifiés et conformes"
          accent="green"
        />
        <StatCard
          icon={XCircle}
          label="Rejetés"
          value={String(docCounts.rejected)}
          hint="Non conformes / illisibles"
          accent="red"
        />
      </div>

      {/* Empty state */}
      {docCounts.total === 0 && (
        <Card className="rounded-2xl border-2 border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Files className="size-10 text-muted-foreground" />
            <div>
              <p className="font-heading text-lg font-bold text-kaza-navy">
                Aucune vérification d&apos;identité soumise
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Les pièces d&apos;identité uploadées par les utilisateurs (table{" "}
                <code className="rounded bg-slate-100 px-1">identity_verifications</code>)
                apparaîtront ici pour modération.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table principale */}
      {docCounts.total > 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Documents uploadés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Rechercher utilisateur, email..."
                className="lg:col-span-2"
              />
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {(
                    Object.keys(DOC_STATUS_BADGE) as AdminUserVerification[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {DOC_STATUS_BADGE[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-[1150px] w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left">Type</th>
                    <th className="px-3 py-3 text-left">Utilisateur</th>
                    <th className="px-3 py-3 text-left">Email</th>
                    <th className="px-3 py-3 text-left">Catégorie</th>
                    <th className="px-3 py-3 text-left">Justificatifs</th>
                    <th className="px-3 py-3 text-left">Statut</th>
                    <th className="px-3 py-3 text-left">Soumis</th>
                    <th className="px-3 py-3 text-left">Revue</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documents.map((d: AdminDocumentRow) => {
                    const Icon = getDocIcon(d.documentType);
                    return (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-kaza-navy/5 text-kaza-navy">
                            <Icon className="size-4" />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/admin/users/${d.userId}`}
                            className="text-sm font-medium text-kaza-navy hover:underline"
                          >
                            {d.userName}
                          </Link>
                          {d.reviewerNotes && (
                            <p className="mt-0.5 text-xs text-red-600">
                              <AlertTriangle className="mr-1 inline size-3" />
                              {d.reviewerNotes}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          <div className="flex flex-col gap-1">
                            <span>{d.userEmail || "—"}</span>
                            {d.emailVerified ? (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                <CheckCircle2 className="size-3" /> Email vérifié
                              </span>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                <XCircle className="size-3" /> Non confirmé
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {getDocLabel(d.documentType)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          {d.extraDocuments.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {d.extraDocuments.map((ex, idx) =>
                                ex.url ? (
                                  <a
                                    key={idx}
                                    href={ex.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-fit items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                                  >
                                    <FileText className="size-3" /> {ex.label}
                                  </a>
                                ) : (
                                  <span
                                    key={idx}
                                    className="inline-flex w-fit items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                                  >
                                    <FileText className="size-3" /> {ex.label}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <DocStatusPill status={d.status} />
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {formatDate(d.submittedAt)}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {d.reviewedAt ? (
                            formatDate(d.reviewedAt)
                          ) : (
                            <span className="italic text-amber-600">
                              En attente
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <DocumentModActions
                              userId={d.userId}
                              userName={d.userName}
                              userEmail={d.userEmail}
                              status={d.status}
                              images={[
                                { label: "Recto", url: d.documentFrontUrl },
                                { label: "Verso", url: d.documentBackUrl },
                                { label: "Selfie", url: d.selfieUrl },
                                ...d.extraDocuments.map((ex) => ({
                                  label: ex.label,
                                  url: ex.url,
                                })),
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats vérification */}
      {verificationStats.length > 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Statistiques de vérification
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Performance opérationnelle par type de pièce
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-kaza-navy">
                  Volume / type
                </p>
                <ul className="space-y-2">
                  {verificationStats.map((s) => (
                    <li
                      key={s.type}
                      className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm"
                    >
                      <span>{getDocLabel(s.type)}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-kaza-blue">
                        <Files className="size-3" /> {s.total} doc.
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-kaza-navy">
                  Taux d&apos;approbation / type
                </p>
                <ul className="space-y-2">
                  {verificationStats.map((s) => (
                    <li
                      key={s.type}
                      className="rounded-lg border bg-white px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span>{getDocLabel(s.type)}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <TrendingUp className="size-3" /> {s.approvalRate}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-kaza-green"
                          style={{ width: `${s.approvalRate}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stockage */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-kaza-navy/10 text-kaza-navy">
            <Database className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg text-kaza-navy">
              Stockage &amp; sécurité
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Hébergement, chiffrement et sauvegardes
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="size-4 text-kaza-blue" />
                <p className="text-xs font-medium text-muted-foreground">
                  Bucket
                </p>
              </div>
              <p className="mt-2 font-heading text-xl font-bold text-kaza-navy">
                identity-documents
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Supabase Storage (privé)
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-kaza-green" />
                <p className="text-xs font-medium text-muted-foreground">
                  Chiffrement
                </p>
              </div>
              <p className="mt-2 font-heading text-xl font-bold text-kaza-navy">
                AES-256
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Au repos &amp; en transit (TLS 1.3)
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-kaza-navy" />
                <p className="text-xs font-medium text-muted-foreground">
                  Région
                </p>
              </div>
              <p className="mt-2 font-heading text-xl font-bold text-kaza-navy">
                Paris
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                eu-west-3 · conforme UE
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 text-amber-600" />
                <p className="text-xs font-medium text-muted-foreground">
                  Sauvegarde
                </p>
              </div>
              <p className="mt-2 font-heading text-xl font-bold text-kaza-navy">
                Quotidienne
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Rétention 90 jours · point-in-time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
