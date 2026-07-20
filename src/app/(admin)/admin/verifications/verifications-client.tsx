"use client";

import { useState, useTransition } from "react";
import {
  Check,
  X,
  IdCard,
  Camera,
  Mail,
  Phone,
  Hash,
  Eye,
  Loader2,
  Inbox,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast-helper";
import {
  approveVerification,
  rejectVerification,
} from "@/actions/verification";

import type { AdminVerificationItem } from "./page";

const DOC_LABELS: Record<string, string> = {
  national_id: "Carte nationale",
  passport: "Passeport",
  driver_license: "Permis de conduire",
  voter_card: "Carte d'électeur",
};

function docLabel(raw: string): string {
  return DOC_LABELS[raw] ?? raw;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0]![0] ?? "") + (parts[1]?.[0] ?? "");
}

function statusTone(status: AdminVerificationItem["status"]): string {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "REJECTED":
      return "border-red-200 bg-red-100 text-red-700";
    case "PENDING":
      return "border-amber-200 bg-amber-100 text-amber-700";
    default:
      return "border-muted bg-muted text-muted-foreground";
  }
}

function statusLabel(status: AdminVerificationItem["status"]): string {
  switch (status) {
    case "APPROVED":
      return "Approuvée";
    case "REJECTED":
      return "Rejetée";
    case "PENDING":
      return "En attente";
    default:
      return "—";
  }
}

interface Props {
  pending: AdminVerificationItem[];
  approved: AdminVerificationItem[];
  rejected: AdminVerificationItem[];
}

export function VerificationsClient({ pending, approved, rejected }: Props) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [confirm, setConfirm] = useState<
    | { type: "approve"; item: AdminVerificationItem }
    | { type: "reject"; item: AdminVerificationItem }
    | null
  >(null);
  const [preview, setPreview] = useState<
    | { src: string; alt: string }
    | null
  >(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setConfirm(null);
    setReason("");
  };

  const onConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "reject" && reason.trim().length < 10) return;

    startTransition(async () => {
      if (confirm.type === "approve") {
        const res = await approveVerification(confirm.item.id);
        if (res.success) {
          toast.success(
            `${confirm.item.userName} — identité approuvée (+500 Kaabo Points).`,
          );
          close();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await rejectVerification(confirm.item.id, reason.trim());
        if (res.success) {
          toast.success("Demande rejetée. L'utilisateur en est informé.");
          close();
        } else {
          toast.error(res.error);
        }
      }
    });
  };

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            En attente
            <Badge className="border-amber-200 bg-amber-100 text-amber-700">
              {pending.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Approuvées
            <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">
              {approved.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejetées
            <Badge className="border-red-200 bg-red-100 text-red-700">
              {rejected.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Queue
            items={pending}
            emptyTitle="Aucun dossier en attente"
            emptyBody="Excellent travail — toutes les demandes ont été traitées."
            onApprove={(item) => setConfirm({ type: "approve", item })}
            onReject={(item) => setConfirm({ type: "reject", item })}
            onPreview={(src, alt) => setPreview({ src, alt })}
            actionable
          />
        </TabsContent>

        <TabsContent value="approved">
          <Queue
            items={approved}
            emptyTitle="Aucune demande approuvée"
            emptyBody="Les demandes que vous validez apparaîtront ici."
            onPreview={(src, alt) => setPreview({ src, alt })}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <Queue
            items={rejected}
            emptyTitle="Aucune demande rejetée"
            emptyBody="Les demandes que vous refusez apparaîtront ici."
            onPreview={(src, alt) => setPreview({ src, alt })}
            showReason
          />
        </TabsContent>
      </Tabs>

      {/* Modale de confirmation Approve / Reject */}
      <Dialog open={!!confirm} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.type === "approve" && "Approuver cette vérification ?"}
              {confirm?.type === "reject" && "Rejeter cette vérification ?"}
            </DialogTitle>
            <DialogDescription>
              {confirm
                ? `${confirm.item.userName} — ${docLabel(confirm.item.documentType)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {confirm?.type === "approve" && (
            <p className="text-sm text-muted-foreground">
              L&apos;utilisateur recevra le badge <strong>Identité vérifiée</strong>{" "}
              et un bonus de <strong>+500 Kaabo Points</strong>. Action immédiate.
            </p>
          )}

          {confirm?.type === "reject" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="reject-reason">
                Motif du rejet <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Document illisible, selfie ne correspond pas, pièce expirée…"
                minLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 caractères — le motif est envoyé à l&apos;utilisateur
                par notification.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>
              Annuler
            </Button>
            <Button
              variant={confirm?.type === "reject" ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={
                isPending ||
                (confirm?.type === "reject" && reason.trim().length < 10)
              }
              className={
                confirm?.type === "approve"
                  ? "bg-kaza-green hover:bg-kaza-green/90"
                  : undefined
              }
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {confirm?.type === "approve" && "Approuver"}
              {confirm?.type === "reject" && "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox image */}
      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.alt ?? "Aperçu"}</DialogTitle>
            <DialogDescription>
              URL signée — expire après 10 minutes.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="relative mx-auto max-h-[70vh] w-full overflow-hidden rounded-lg bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.src}
                alt={preview.alt}
                className="mx-auto max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Queue({
  items,
  emptyTitle,
  emptyBody,
  onApprove,
  onReject,
  onPreview,
  actionable,
  showReason,
}: {
  items: AdminVerificationItem[];
  emptyTitle: string;
  emptyBody: string;
  onApprove?: (item: AdminVerificationItem) => void;
  onReject?: (item: AdminVerificationItem) => void;
  onPreview: (src: string, alt: string) => void;
  actionable?: boolean;
  showReason?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <Inbox className="mx-auto size-10 text-muted-foreground/50" />
        <h3 className="mt-4 font-heading text-base font-semibold text-kaza-navy">
          {emptyTitle}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((v) => (
        <article
          key={v.id}
          className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-kaza-navy/10 text-sm font-bold text-kaza-navy">
                {initials(v.userName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {v.userName}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Mail className="size-3" /> {v.userEmail}
                </p>
              </div>
            </div>
            <Badge className={cn("uppercase", statusTone(v.status))}>
              {statusLabel(v.status)}
            </Badge>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 border-b border-border px-4 py-3 text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-foreground">
                <IdCard className="size-3.5 text-kaza-blue" />
                {docLabel(v.documentType)}
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                Soumis
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {v.submittedRelative}
              </p>
            </div>
            {v.documentNumber && (
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  N° pièce
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-foreground">
                  <Hash className="size-3.5 text-muted-foreground" />
                  {v.documentNumber}
                </p>
              </div>
            )}
            {v.phoneNumber && (
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  Téléphone
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-foreground">
                  <Phone className="size-3.5 text-muted-foreground" />
                  {v.phoneNumber}
                </p>
              </div>
            )}
          </div>

          {/* Pièces (thumbnails cliquables) */}
          <div className="grid grid-cols-3 gap-2 p-3">
            <Thumb
              src={v.documentFrontUrl}
              label="Recto"
              icon={IdCard}
              onClick={(src) => onPreview(src, `${v.userName} — Recto`)}
            />
            <Thumb
              src={v.documentBackUrl}
              label="Verso"
              icon={IdCard}
              onClick={(src) => onPreview(src, `${v.userName} — Verso`)}
            />
            <Thumb
              src={v.selfieUrl}
              label="Selfie"
              icon={Camera}
              onClick={(src) => onPreview(src, `${v.userName} — Selfie`)}
            />
          </div>

          {/* Motif (tab Rejetées uniquement) */}
          {showReason && v.reviewerNotes && (
            <div className="border-t border-border bg-red-50/50 px-4 py-3 text-xs text-red-800">
              <p className="font-semibold">Motif du rejet</p>
              <p className="mt-1">{v.reviewerNotes}</p>
              {v.reviewedRelative && (
                <p className="mt-1 text-[11px] text-red-600/80">
                  {v.reviewedRelative}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {actionable && (
            <div className="flex flex-wrap gap-2 border-t border-border bg-muted/20 p-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onReject?.(v)}
              >
                <X className="size-3.5" /> Rejeter
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-kaza-green hover:bg-kaza-green/90"
                onClick={() => onApprove?.(v)}
              >
                <Check className="size-3.5" /> Approuver
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function Thumb({
  src,
  label,
  icon: Icon,
  onClick,
}: {
  src: string | null;
  label: string;
  icon: typeof IdCard;
  onClick: (src: string) => void;
}) {
  if (!src) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40">
        <Icon className="size-6 text-muted-foreground/60" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground/70">Non fourni</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(src)}
      className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 transition hover:border-kaza-blue hover:shadow-sm"
      title={`Voir ${label}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="h-full w-full object-cover transition group-hover:scale-105"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        <span className="flex items-center gap-1">
          <Icon className="size-3" />
          {label}
        </span>
        <Eye className="size-3 opacity-0 transition group-hover:opacity-100" />
      </span>
    </button>
  );
}
