"use client";

import { useState } from "react";
import { Check, X, ImageIcon, IdCard, Camera } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn, getInitials } from "@/lib/utils";

type VerificationStatus = "pending" | "approved" | "rejected";

interface VerificationRequest {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  documentType: "CNI" | "Passeport" | "Permis";
  submittedAt: string;
  status: VerificationStatus;
}

const allVerifications: VerificationRequest[] = [
  {
    id: "v-001",
    user: {
      id: "u-003",
      firstName: "Moussa",
      lastName: "Adékambi",
      email: "moussa.a@gmail.com",
    },
    documentType: "CNI",
    submittedAt: "2026-05-24",
    status: "pending",
  },
  {
    id: "v-002",
    user: {
      id: "u-011",
      firstName: "Lucie",
      lastName: "Houessou",
      email: "lucie.h@gmail.com",
    },
    documentType: "Passeport",
    submittedAt: "2026-05-23",
    status: "pending",
  },
  {
    id: "v-003",
    user: {
      id: "u-006",
      firstName: "Karim",
      lastName: "Lawal",
      email: "karim.lawal@gmail.com",
    },
    documentType: "CNI",
    submittedAt: "2026-05-22",
    status: "pending",
  },
  {
    id: "v-004",
    user: {
      id: "u-013",
      firstName: "Béatrice",
      lastName: "Codjia",
      email: "b.codjia@yahoo.fr",
    },
    documentType: "Permis",
    submittedAt: "2026-05-22",
    status: "pending",
  },
  {
    id: "v-005",
    user: {
      id: "u-001",
      firstName: "Aminata",
      lastName: "Sow",
      email: "aminata.sow@gmail.com",
    },
    documentType: "CNI",
    submittedAt: "2026-05-20",
    status: "approved",
  },
  {
    id: "v-006",
    user: {
      id: "u-004",
      firstName: "Fatima",
      lastName: "Adjovi",
      email: "fatima.adjovi@etu.uac.bj",
    },
    documentType: "Passeport",
    submittedAt: "2026-05-19",
    status: "approved",
  },
  {
    id: "v-007",
    user: {
      id: "u-014",
      firstName: "Sébastien",
      lastName: "Aho",
      email: "s.aho@hotmail.com",
    },
    documentType: "CNI",
    submittedAt: "2026-05-18",
    status: "rejected",
  },
];

function VerificationCard({
  request,
  onApprove,
  onReject,
}: {
  request: VerificationRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      {/* User header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-kaza-navy/10 text-sm text-kaza-navy">
              {getInitials(request.user.firstName, request.user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {request.user.firstName} {request.user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {request.user.email}
            </span>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 border-b border-border px-5 py-3 text-xs">
        <div className="flex flex-col">
          <span className="font-medium uppercase tracking-wide text-muted-foreground">
            Type de pièce
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-foreground">
            <IdCard className="size-3.5 text-kaza-blue" />
            {request.documentType}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium uppercase tracking-wide text-muted-foreground">
            Soumis le
          </span>
          <span className="mt-0.5 text-sm font-medium text-foreground">
            {new Date(request.submittedAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </div>

      {/* Document placeholders */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <DocumentPlaceholder label="Recto" icon={IdCard} />
        <DocumentPlaceholder label="Verso" icon={IdCard} />
        <DocumentPlaceholder label="Selfie" icon={Camera} />
      </div>

      {/* Actions */}
      {request.status === "pending" && (
        <div className="flex gap-2 border-t border-border bg-muted/20 p-3">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-kaza-error hover:bg-red-50"
            onClick={onReject}
          >
            <X className="size-4" />
            Rejeter
          </Button>
          <Button
            className="flex-1 bg-kaza-green hover:bg-kaza-green/90"
            onClick={onApprove}
          >
            <Check className="size-4" />
            Approuver
          </Button>
        </div>
      )}
    </article>
  );
}

function DocumentPlaceholder({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof ImageIcon;
}) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40">
      <Icon className="size-6 text-muted-foreground" />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function AdminVerificationsPage() {
  const [tab, setTab] = useState<VerificationStatus>("pending");
  const [dialog, setDialog] = useState<{
    type: "approve" | "reject";
    request: VerificationRequest;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = allVerifications.filter((v) => v.status === tab);

  const counts = {
    pending: allVerifications.filter((v) => v.status === "pending").length,
    approved: allVerifications.filter((v) => v.status === "approved").length,
    rejected: allVerifications.filter((v) => v.status === "rejected").length,
  };

  const handleConfirm = () => {
    if (!dialog) return;
    if (dialog.type === "reject" && rejectReason.trim().length < 3) return;
    console.log(
      `[admin] KYC ${dialog.type === "approve" ? "approuvée" : "rejetée"}: ${dialog.request.id}`,
      dialog.type === "reject" ? { reason: rejectReason } : {}
    );
    setDialog(null);
    setRejectReason("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Vérifications d&apos;identité
        </h1>
        <p className="text-sm text-muted-foreground">
          Validez ou rejetez les justificatifs d&apos;identité soumis par les
          utilisateurs (KYC).
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as VerificationStatus)}>
        <TabsList className="bg-muted/60">
          <TabsTrigger value="pending" className="gap-2">
            En attente
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                tab === "pending"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-muted-foreground/15 text-muted-foreground"
              )}
            >
              {counts.pending}
            </span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Approuvées
            <span className="text-[10px] font-bold text-muted-foreground">
              {counts.approved}
            </span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejetées
            <span className="text-[10px] font-bold text-muted-foreground">
              {counts.rejected}
            </span>
          </TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as VerificationStatus[]).map(
          (statusKey) => (
            <TabsContent key={statusKey} value={statusKey} className="mt-4">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-border bg-card">
                  <EmptyState
                    title="Aucune demande"
                    description="Aucune demande dans cet état pour le moment."
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((request) => (
                    <VerificationCard
                      key={request.id}
                      request={request}
                      onApprove={() =>
                        setDialog({ type: "approve", request })
                      }
                      onReject={() => {
                        setRejectReason("");
                        setDialog({ type: "reject", request });
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )
        )}
      </Tabs>

      {/* Dialog */}
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "approve"
                ? "Approuver cette vérification ?"
                : "Rejeter cette vérification ?"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.request.user.firstName} {dialog?.request.user.lastName} —{" "}
              {dialog?.request.documentType}
            </DialogDescription>
          </DialogHeader>

          {dialog?.type === "reject" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="kyc-reason">
                Motif du rejet <span className="text-kaza-error">*</span>
              </Label>
              <Textarea
                id="kyc-reason"
                placeholder="Ex: document illisible, selfie ne correspond pas..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {dialog?.type === "approve" && (
            <p className="text-sm text-muted-foreground">
              L&apos;utilisateur sera marqué comme vérifié et recevra son badge
              de confiance.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialog(null);
                setRejectReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant={dialog?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={
                dialog?.type === "reject" && rejectReason.trim().length < 3
              }
            >
              {dialog?.type === "approve" ? "Approuver" : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
