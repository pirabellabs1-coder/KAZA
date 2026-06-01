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
  FolderOpen,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Download,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  getApplicantDossier,
  type ApplicantDossier,
} from "@/actions/applicant-dossier";
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
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/properties/${a.propertyId}`}>
                  <Eye className="size-3.5" /> Voir le bien
                </Link>
              </Button>
              <DossierButton applicationId={a.id} candidateName={a.tenantName} />
            </div>
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

function DossierButton({
  applicationId,
  candidateName,
}: {
  applicationId: string;
  candidateName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dossier, setDossier] = useState<ApplicantDossier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getApplicantDossier(applicationId)
      .then((res) => {
        if (res.success && res.dossier) setDossier(res.dossier);
        else setError(res.error ?? "Dossier indisponible.");
      })
      .catch(() => setError("Dossier indisponible."))
      .finally(() => setLoading(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && !dossier && !loading) load();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FolderOpen className="size-3.5" /> Dossier du candidat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dossier de {candidateName}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <p className="py-6 text-center text-sm text-rose-600">{error}</p>
        )}

        {dossier && !loading && (
          <div className="space-y-4">
            {/* Identité / vérification KYC */}
            <div className="rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {dossier.tenant.name}
                </span>
                {dossier.tenant.verified ? (
                  <Badge className="gap-1 bg-kaza-green/15 text-kaza-green">
                    <ShieldCheck className="size-3.5" /> Identité vérifiée
                  </Badge>
                ) : (
                  <Badge className="gap-1 bg-amber-100 text-amber-800">
                    <ShieldAlert className="size-3.5" /> Non vérifiée
                  </Badge>
                )}
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {dossier.tenant.email && <p>Email : {dossier.tenant.email}</p>}
                {dossier.tenant.phone && (
                  <p>Téléphone : {dossier.tenant.phone}</p>
                )}
              </div>
            </div>

            {/* Pièces du dossier locatif */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pièces fournies ({dossier.documents.length})
              </p>
              {dossier.documents.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 py-6 text-center text-sm text-muted-foreground">
                  Le candidat n&apos;a pas encore déposé de pièces
                  justificatives.
                </p>
              ) : (
                <ul className="space-y-2">
                  {dossier.documents.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-4 shrink-0 text-kaza-blue" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {d.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {d.docTypeLabel}
                            {d.amount ? ` · ${d.amount}` : ""}
                          </p>
                        </div>
                      </div>
                      {d.signedUrl ? (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="shrink-0 gap-1"
                        >
                          <a
                            href={d.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="size-3.5" /> Ouvrir
                          </a>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          indisponible
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
