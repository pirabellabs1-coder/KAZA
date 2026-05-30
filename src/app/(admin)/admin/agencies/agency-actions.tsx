"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Ban,
  CheckCircle2,
  Eye,
  ClipboardCheck,
  Power,
  ShieldCheck,
  ShieldX,
  Mail,
  Phone,
  MapPin,
  Building2,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast-helper";
import { cn, formatFcfa } from "@/lib/utils";
import { setAgencyStatus, setAgencyVerified } from "@/actions/admin";

// ---------------------------------------------------------------------------
// Données minimales nécessaires aux actions (sous-ensemble de AdminAgencyRow).
// On garde un type local pour découpler le client component de la query.
// ---------------------------------------------------------------------------

export interface AgencyActionData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  isVerified: boolean;
  verificationStatus: "UNVERIFIED" | "PENDING" | "APPROVED" | "REJECTED";
  signedAt: string;
  activeProperties: number;
  monthlyPlanFcfa: number;
  planName: string | null;
  /** Statut d'affichage dérivé côté page (ACTIVE/SUSPENDED/PENDING_KYC/TRIAL). */
  displayStatus: "ACTIVE" | "SUSPENDED" | "PENDING_KYC" | "TRIAL";
}

const STATUS_LABEL: Record<AgencyActionData["displayStatus"], string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  PENDING_KYC: "KYC en attente",
  TRIAL: "Période d’essai",
};

const STATUS_BADGE: Record<AgencyActionData["displayStatus"], string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-700",
  PENDING_KYC: "bg-blue-100 text-blue-700",
  TRIAL: "bg-amber-100 text-amber-700",
};

// ---------------------------------------------------------------------------
// Ligne d'information du dialog d'inspection.
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-kaza-navy">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal — boutons "Voir détail" + "Auditer" + menu d'actions.
// ---------------------------------------------------------------------------

export function AgencyActions({ agency }: { agency: AgencyActionData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [detailOpen, setDetailOpen] = useState(false);

  const run = (
    fn: () => Promise<{ success: boolean; error?: string }>,
    okMessage: string,
  ) => {
    startTransition(async () => {
      const result = await fn();
      if (result.success) {
        toast.success(okMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "Action impossible.");
      }
    });
  };

  const handleVerify = () =>
    run(
      () => setAgencyVerified(agency.id, true),
      `${agency.name} a été vérifiée.`,
    );

  const handleUnverify = () =>
    run(
      () => setAgencyVerified(agency.id, false),
      `Vérification retirée pour ${agency.name}.`,
    );

  const handleSuspend = () =>
    run(
      () => setAgencyStatus(agency.id, "SUSPEND"),
      `${agency.name} a été suspendue.`,
    );

  const handleActivate = () =>
    run(
      () => setAgencyStatus(agency.id, "ACTIVATE"),
      `${agency.name} a été réactivée.`,
    );

  const isSuspended = agency.displayStatus === "SUSPENDED";

  return (
    <>
      {/* Boutons visibles dans la carte */}
      <Button
        size="sm"
        variant="outline"
        className="flex-1"
        onClick={() => setDetailOpen(true)}
      >
        <Eye className="size-3.5" /> Voir détail
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setDetailOpen(true)}
        title="Auditer cette agence"
      >
        <ClipboardCheck className="size-3.5" /> Auditer
      </Button>

      {/* Menu d'actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={isPending}
            aria-label={`Actions pour ${agency.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions agence</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setDetailOpen(true)}>
            <Eye className="size-4" /> Voir détail
          </DropdownMenuItem>

          {agency.isVerified ? (
            <DropdownMenuItem onSelect={handleUnverify}>
              <ShieldX className="size-4 text-amber-600" /> Retirer la vérification
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={handleVerify}>
              <CheckCircle2 className="size-4 text-emerald-600" /> Vérifier l’agence
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {isSuspended ? (
            <DropdownMenuItem onSelect={handleActivate}>
              <Power className="size-4 text-emerald-600" /> Réactiver l’agence
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onSelect={handleSuspend}>
              <Ban className="size-4" /> Suspendre l’agence
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog d'inspection */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-kaza-navy" />
              {agency.name}
            </DialogTitle>
            <DialogDescription>
              Fiche d’inspection — informations contractuelles et compliance.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={STATUS_BADGE[agency.displayStatus]}>
              {STATUS_LABEL[agency.displayStatus]}
            </Badge>
            <Badge
              className={cn(
                "border",
                agency.isVerified
                  ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                  : "border-amber-300 bg-amber-100 text-amber-700",
              )}
            >
              <BadgeCheck className="size-3.5" />
              {agency.isVerified ? "Vérifiée" : "Non vérifiée"}
            </Badge>
            <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
              KYC&nbsp;: {agency.verificationStatus}
            </Badge>
          </div>

          <div className="divide-y divide-border">
            <InfoRow icon={Mail} label="Email" value={agency.email || "—"} />
            <InfoRow
              icon={Phone}
              label="Téléphone"
              value={agency.phone || "—"}
            />
            <InfoRow
              icon={MapPin}
              label="Localisation"
              value={agency.city || "—"}
            />
            <InfoRow
              icon={Building2}
              label="Annonces actives"
              value={agency.activeProperties}
            />
            <InfoRow
              icon={ShieldCheck}
              label="Plan / abonnement"
              value={
                agency.planName
                  ? `${agency.planName}${
                      agency.monthlyPlanFcfa > 0
                        ? ` · ${formatFcfa(agency.monthlyPlanFcfa)} / mois`
                        : ""
                    }`
                  : "Aucun abonnement actif"
              }
            />
            <InfoRow
              icon={CalendarDays}
              label="Inscrite le"
              value={new Date(agency.signedAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            {agency.isVerified ? (
              <Button
                variant="outline"
                onClick={handleUnverify}
                disabled={isPending}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <ShieldX className="size-4" /> Retirer la vérification
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={isPending}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCircle2 className="size-4" /> Vérifier l’agence
              </Button>
            )}

            {isSuspended ? (
              <Button
                onClick={handleActivate}
                disabled={isPending}
                className="bg-kaza-green hover:bg-kaza-green/90"
              >
                <Power className="size-4" /> Réactiver
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleSuspend}
                disabled={isPending}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Ban className="size-4" /> Suspendre
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
