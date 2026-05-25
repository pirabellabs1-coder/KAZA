"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import {
  StatusBadge,
  type StatusType,
} from "@/components/admin/status-badge";
import { formatPrice } from "@/lib/utils";

type PropertyStatus = Extract<
  StatusType,
  "pending" | "published" | "rejected" | "suspended"
>;

interface PropertyRow {
  id: string;
  title: string;
  photo: string;
  owner: string;
  city: string;
  type: string;
  price: number;
  status: PropertyStatus;
  submittedAt: string;
  [key: string]: unknown;
}

const allProperties: PropertyRow[] = [
  {
    id: "A-1547",
    title: "Studio meublé - Fidjrossè",
    photo: "https://picsum.photos/seed/admin-p1/200/200",
    owner: "Pierre Hounsou",
    city: "Cotonou",
    type: "Studio",
    price: 95000,
    status: "pending",
    submittedAt: "2026-05-24",
  },
  {
    id: "A-1546",
    title: "Villa familiale 4 chambres",
    photo: "https://picsum.photos/seed/admin-p2/200/200",
    owner: "Mariam Bio",
    city: "Porto-Novo",
    type: "Villa",
    price: 320000,
    status: "pending",
    submittedAt: "2026-05-24",
  },
  {
    id: "A-1545",
    title: "Appartement F3 Cadjèhoun",
    photo: "https://picsum.photos/seed/admin-p3/200/200",
    owner: "Jean Sossa",
    city: "Cotonou",
    type: "Appartement",
    price: 180000,
    status: "published",
    submittedAt: "2026-05-23",
  },
  {
    id: "A-1544",
    title: "Chambre étudiante Abomey-Calavi",
    photo: "https://picsum.photos/seed/admin-p4/200/200",
    owner: "Fatima Adjovi",
    city: "Abomey-Calavi",
    type: "Chambre",
    price: 45000,
    status: "pending",
    submittedAt: "2026-05-22",
  },
  {
    id: "A-1543",
    title: "Maison plain-pied avec jardin",
    photo: "https://picsum.photos/seed/admin-p5/200/200",
    owner: "Eric Tchégoun",
    city: "Parakou",
    type: "Maison",
    price: 150000,
    status: "published",
    submittedAt: "2026-05-22",
  },
  {
    id: "A-1542",
    title: "Duplex moderne Akpakpa",
    photo: "https://picsum.photos/seed/admin-p6/200/200",
    owner: "Lucie Houessou",
    city: "Cotonou",
    type: "Duplex",
    price: 410000,
    status: "rejected",
    submittedAt: "2026-05-21",
  },
  {
    id: "A-1541",
    title: "Bureau partagé Ganhi",
    photo: "https://picsum.photos/seed/admin-p7/200/200",
    owner: "Société KAZA Pro",
    city: "Cotonou",
    type: "Bureau",
    price: 250000,
    status: "suspended",
    submittedAt: "2026-05-20",
  },
  {
    id: "A-1540",
    title: "Villa moderne avec piscine",
    photo: "https://picsum.photos/seed/admin-p8/200/200",
    owner: "Pascal Agbo",
    city: "Cotonou",
    type: "Villa",
    price: 850000,
    status: "published",
    submittedAt: "2026-05-19",
  },
  {
    id: "A-1539",
    title: "Studio neuf - Centre-ville",
    photo: "https://picsum.photos/seed/admin-p9/200/200",
    owner: "Rose Akpovi",
    city: "Porto-Novo",
    type: "Studio",
    price: 75000,
    status: "pending",
    submittedAt: "2026-05-19",
  },
  {
    id: "A-1538",
    title: "Appartement F2 Mènontin",
    photo: "https://picsum.photos/seed/admin-p10/200/200",
    owner: "Karim Lawal",
    city: "Cotonou",
    type: "Appartement",
    price: 130000,
    status: "rejected",
    submittedAt: "2026-05-18",
  },
  {
    id: "A-1537",
    title: "Chambre + salle d'eau",
    photo: "https://picsum.photos/seed/admin-p11/200/200",
    owner: "Yvonne Dossou",
    city: "Bohicon",
    type: "Chambre",
    price: 35000,
    status: "published",
    submittedAt: "2026-05-17",
  },
  {
    id: "A-1536",
    title: "Maison familiale 5 pièces",
    photo: "https://picsum.photos/seed/admin-p12/200/200",
    owner: "Antoine Zinsou",
    city: "Parakou",
    type: "Maison",
    price: 200000,
    status: "pending",
    submittedAt: "2026-05-17",
  },
];

const cities = ["Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Bohicon"];
const types = ["Studio", "Appartement", "Villa", "Maison", "Chambre", "Duplex", "Bureau"];

export default function AdminPropertiesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<{
    type: "approve" | "reject";
    property: PropertyRow;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const rows = allProperties.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (cityFilter !== "all" && p.city !== cityFilter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    return true;
  });

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
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Voir"
            onClick={() => console.log("view", row.id)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-kaza-green hover:bg-green-50 hover:text-kaza-green"
            title="Approuver"
            onClick={() => setDialog({ type: "approve", property: row })}
          >
            <Check className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-kaza-error hover:bg-red-50 hover:text-kaza-error"
            title="Rejeter"
            onClick={() => {
              setRejectReason("");
              setDialog({ type: "reject", property: row });
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleConfirm = () => {
    if (!dialog) return;
    if (dialog.type === "reject" && rejectReason.trim().length < 3) {
      return;
    }
    console.log(
      `[admin] ${dialog.type === "approve" ? "Approuvée" : "Rejetée"}: ${dialog.property.id}`,
      dialog.type === "reject" ? { reason: rejectReason } : {}
    );
    setDialog(null);
    setRejectReason("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Modération des annonces
        </h1>
        <p className="text-sm text-muted-foreground">
          Approuvez, rejetez ou suspendez les annonces soumises par les
          propriétaires.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
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

      {/* Confirmation modal */}
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
                placeholder="Expliquez au propriétaire les raisons du rejet..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              {rejectReason.trim().length > 0 &&
                rejectReason.trim().length < 3 && (
                  <p className="text-xs text-kaza-error">
                    Le motif doit contenir au moins 3 caractères.
                  </p>
                )}
            </div>
          )}

          {dialog?.type === "approve" && (
            <p className="text-sm text-muted-foreground">
              L&apos;annonce sera publiée et visible sur la plateforme. Le
              propriétaire recevra une notification.
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
