"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Check, Eye, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import {
  StatusBadge,
  type StatusType,
} from "@/components/admin/status-badge";
import { toast } from "@/components/ui/toast-helper";
import { approveProperty, rejectProperty } from "@/actions/admin";
import {
  getAdminActions,
  recordAdminAction,
  type AdminAction,
} from "@/lib/admin-state";
import { formatPrice } from "@/lib/utils";

export type PropertyStatus = Extract<
  StatusType,
  "pending" | "published" | "rejected" | "suspended"
>;

export interface PropertyRow {
  id: string;
  title: string;
  photo: string;
  owner: string;
  ownerEmail: string;
  city: string;
  type: string;
  price: number;
  status: PropertyStatus;
  submittedAt: string;
  [key: string]: unknown;
}

const types = [
  "Studio",
  "Appartement",
  "Villa",
  "Maison",
  "Chambre",
  "Duplex",
  "Bureau",
];

interface PropertiesTableProps {
  rows: PropertyRow[];
  adminEmail: string;
}

type DialogState =
  | { type: "approve"; property: PropertyRow }
  | { type: "reject"; property: PropertyRow }
  | null;

export function PropertiesTable({ rows, adminEmail }: PropertiesTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [reason, setReason] = useState("");
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [isPending, startTransition] = useTransition();

  const cities = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.city) set.add(r.city);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [rows]);

  useEffect(() => {
    setActions(getAdminActions());
  }, []);

  const effectiveRows = useMemo<PropertyRow[]>(() => {
    return rows.map((row) => {
      const approve = actions
        .filter(
          (a) => a.targetId === row.id && a.type === "approve_property",
        )
        .at(-1);
      const reject = actions
        .filter((a) => a.targetId === row.id && a.type === "reject_property")
        .at(-1);
      const lastA = approve ? new Date(approve.decidedAt).getTime() : 0;
      const lastR = reject ? new Date(reject.decidedAt).getTime() : 0;
      if (lastA > lastR && lastA > 0) {
        return { ...row, status: "published" as PropertyStatus };
      }
      if (lastR > lastA && lastR > 0) {
        return { ...row, status: "rejected" as PropertyStatus };
      }
      return row;
    });
  }, [rows, actions]);

  const filtered = effectiveRows.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (cityFilter !== "all" && p.city !== cityFilter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

  const handleConfirm = () => {
    if (!dialog) return;
    const property = dialog.property;

    if (dialog.type === "approve") {
      startTransition(async () => {
        const res = await approveProperty({
          propertyId: property.id,
          propertyTitle: property.title,
          ownerEmail: property.ownerEmail,
          ownerName: property.owner,
        });
        const recorded = recordAdminAction({
          type: "approve_property",
          targetId: property.id,
          decidedBy: adminEmail,
        });
        setActions((prev) => [...prev, recorded]);
        toast.success(
          res.emailSent
            ? `Annonce #${property.id} publiée — email envoyé à ${property.owner}.`
            : `Annonce #${property.id} publiée (email non envoyé).`,
        );
        setDialog(null);
        setReason("");
      });
      return;
    }

    if (dialog.type === "reject") {
      if (reason.trim().length < 3) return;
      const trimmedReason = reason.trim();
      startTransition(async () => {
        const res = await rejectProperty({
          propertyId: property.id,
          propertyTitle: property.title,
          ownerEmail: property.ownerEmail,
          ownerName: property.owner,
          reason: trimmedReason,
        });
        const recorded = recordAdminAction({
          type: "reject_property",
          targetId: property.id,
          reason: trimmedReason,
          decidedBy: adminEmail,
        });
        setActions((prev) => [...prev, recorded]);
        toast.success(
          res.emailSent
            ? `Annonce #${property.id} rejetée — email envoyé.`
            : `Annonce #${property.id} rejetée (email non envoyé).`,
        );
        setDialog(null);
        setReason("");
      });
    }
  };

  const columns: DataTableColumn<PropertyRow>[] = [
    {
      key: "photo",
      label: "Photo",
      render: (row) => (
        <div className="relative size-10 overflow-hidden rounded-md bg-muted">
          <Image
            src={row.photo}
            alt={row.title}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </div>
      ),
    },
    {
      key: "title",
      label: "Titre",
      sortValue: (row) => row.title,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.title}</span>
          <span className="text-xs text-muted-foreground">#{row.id}</span>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Propriétaire",
      sortValue: (row) => row.owner,
      render: (row) => <span className="text-sm">{row.owner}</span>,
    },
    {
      key: "city",
      label: "Ville",
      sortValue: (row) => row.city,
      render: (row) => <span className="text-sm">{row.city}</span>,
    },
    {
      key: "price",
      label: "Prix",
      sortValue: (row) => row.price,
      align: "right",
      render: (row) => (
        <span className="font-medium text-foreground">
          {formatPrice(row.price)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "submittedAt",
      label: "Soumise le",
      sortValue: (row) => row.submittedAt,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.submittedAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => {
        const decided = row.status !== "pending";
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Voir l'annonce"
              asChild
            >
              <a
                href={`/properties/${row.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="size-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-kaza-green hover:bg-green-50 hover:text-kaza-green disabled:opacity-30"
              title={decided ? "Déjà traitée" : "Approuver"}
              disabled={decided}
              onClick={() => setDialog({ type: "approve", property: row })}
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-kaza-error hover:bg-red-50 hover:text-kaza-error disabled:opacity-30"
              title={decided ? "Déjà traitée" : "Rejeter"}
              disabled={decided}
              onClick={() => {
                setReason("");
                setDialog({ type: "reject", property: row });
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={filtered}
        searchAccessor={(row) => `${row.title} ${row.owner} ${row.city}`}
        searchPlaceholder="Rechercher par titre, propriétaire, ville..."
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="published">Publiée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="Aucune annonce"
        emptyDescription="Aucune annonce ne correspond à ces filtres."
      />

      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "approve"
                ? "Approuver cette annonce ?"
                : "Rejeter cette annonce ?"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.property.title} — #{dialog?.property.id}
            </DialogDescription>
          </DialogHeader>

          {dialog?.type === "reject" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="reject-reason">
                Motif du rejet <span className="text-kaza-error">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Ex : photos non conformes, prix incohérent, description insuffisante..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Ce motif sera envoyé au propriétaire par email.
              </p>
            </div>
          )}

          {dialog?.type === "approve" && (
            <p className="text-sm text-muted-foreground">
              L&apos;annonce sera publiée et visible sur la plateforme. Le
              propriétaire <strong>{dialog?.property.owner}</strong> recevra une
              notification par email.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialog(null);
                setReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant={dialog?.type === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={
                isPending ||
                (dialog?.type === "reject" && reason.trim().length < 3)
              }
            >
              {isPending
                ? "En cours..."
                : dialog?.type === "approve"
                  ? "Approuver"
                  : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
