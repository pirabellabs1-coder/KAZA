"use client";

import { useState } from "react";
import { Eye, Ban, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn, getInitials } from "@/lib/utils";

type UserStatus = "active" | "suspended";
type UserRole = "OWNER" | "TENANT" | "STUDENT" | "ADMIN";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  status: UserStatus;
  registeredAt: string;
  [key: string]: unknown;
}

const allUsers: UserRow[] = [
  {
    id: "u-001",
    firstName: "Aminata",
    lastName: "Sow",
    email: "aminata.sow@gmail.com",
    role: "TENANT",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-25",
  },
  {
    id: "u-002",
    firstName: "Pierre",
    lastName: "Hounsou",
    email: "p.hounsou@yahoo.fr",
    role: "OWNER",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-24",
  },
  {
    id: "u-003",
    firstName: "Moussa",
    lastName: "Adékambi",
    email: "moussa.a@gmail.com",
    role: "OWNER",
    isVerified: false,
    status: "active",
    registeredAt: "2026-05-23",
  },
  {
    id: "u-004",
    firstName: "Fatima",
    lastName: "Adjovi",
    email: "fatima.adjovi@etu.uac.bj",
    role: "STUDENT",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-22",
  },
  {
    id: "u-005",
    firstName: "Eric",
    lastName: "Tchégoun",
    email: "eric.t@orange.bj",
    role: "OWNER",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-21",
  },
  {
    id: "u-006",
    firstName: "Karim",
    lastName: "Lawal",
    email: "karim.lawal@gmail.com",
    role: "TENANT",
    isVerified: false,
    status: "suspended",
    registeredAt: "2026-05-20",
  },
  {
    id: "u-007",
    firstName: "Rose",
    lastName: "Akpovi",
    email: "rose.akpovi@hotmail.com",
    role: "OWNER",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-19",
  },
  {
    id: "u-008",
    firstName: "Antoine",
    lastName: "Zinsou",
    email: "antoine.z@kaza.dev",
    role: "ADMIN",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-18",
  },
  {
    id: "u-009",
    firstName: "Yvonne",
    lastName: "Dossou",
    email: "y.dossou@gmail.com",
    role: "TENANT",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-17",
  },
  {
    id: "u-010",
    firstName: "Pascal",
    lastName: "Agbo",
    email: "p.agbo@outlook.com",
    role: "OWNER",
    isVerified: true,
    status: "active",
    registeredAt: "2026-05-16",
  },
  {
    id: "u-011",
    firstName: "Lucie",
    lastName: "Houessou",
    email: "lucie.h@gmail.com",
    role: "STUDENT",
    isVerified: false,
    status: "active",
    registeredAt: "2026-05-15",
  },
  {
    id: "u-012",
    firstName: "Jean",
    lastName: "Sossa",
    email: "jean.sossa@yahoo.fr",
    role: "OWNER",
    isVerified: true,
    status: "suspended",
    registeredAt: "2026-05-14",
  },
];

const roleLabels: Record<UserRole, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
  ADMIN: "Admin",
};

const roleBadgeClasses: Record<UserRole, string> = {
  OWNER: "bg-blue-100 text-blue-700 border-blue-200",
  TENANT: "bg-purple-100 text-purple-700 border-purple-200",
  STUDENT: "bg-teal-100 text-teal-700 border-teal-200",
  ADMIN: "bg-kaza-navy/10 text-kaza-navy border-kaza-navy/20",
};

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");

  const rows = allUsers.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (verifiedFilter === "yes" && !u.isVerified) return false;
    if (verifiedFilter === "no" && u.isVerified) return false;
    return true;
  });

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "user",
      label: "Utilisateur",
      sortValue: (row) => `${row.lastName} ${row.firstName}`,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-kaza-navy/10 text-xs text-kaza-navy">
              {getInitials(row.firstName, row.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {row.firstName} {row.lastName}
            </span>
            <span className="text-xs text-muted-foreground">#{row.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortValue: (row) => row.email,
      render: (row) => <span className="text-sm">{row.email}</span>,
    },
    {
      key: "role",
      label: "Rôle",
      sortValue: (row) => row.role,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            roleBadgeClasses[row.role]
          )}
        >
          {roleLabels[row.role]}
        </span>
      ),
    },
    {
      key: "verified",
      label: "Vérifié",
      sortValue: (row) => (row.isVerified ? 1 : 0),
      render: (row) =>
        row.isVerified ? (
          <Badge className="border-green-200 bg-green-100 text-green-700">
            <CheckCircle2 className="size-3" />
            Vérifié
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Non vérifié
          </Badge>
        ),
    },
    {
      key: "status",
      label: "Statut",
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "registeredAt",
      label: "Inscrit le",
      sortValue: (row) => row.registeredAt,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.registeredAt).toLocaleDateString("fr-FR")}
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
            title="Voir le profil"
            onClick={() => console.log("view profile", row.id)}
          >
            <Eye className="size-4" />
          </Button>
          {row.status === "active" ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-kaza-error hover:bg-red-50 hover:text-kaza-error"
              title="Suspendre"
              onClick={() => console.log("suspend", row.id)}
            >
              <Ban className="size-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-kaza-green hover:bg-green-50 hover:text-kaza-green"
              title="Réactiver"
              onClick={() => console.log("reactivate", row.id)}
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Gestion des utilisateurs
        </h1>
        <p className="text-sm text-muted-foreground">
          Consultez, suspendez ou réactivez les comptes utilisateurs de la
          plateforme.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        searchAccessor={(row) =>
          `${row.firstName} ${row.lastName} ${row.email}`
        }
        searchPlaceholder="Rechercher par nom ou email..."
        filters={
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="OWNER">Propriétaire</SelectItem>
                <SelectItem value="TENANT">Locataire</SelectItem>
                <SelectItem value="STUDENT">Étudiant</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Identité vérifiée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Vérification (tous)</SelectItem>
                <SelectItem value="yes">Vérifiés</SelectItem>
                <SelectItem value="no">Non vérifiés</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="Aucun utilisateur"
        emptyDescription="Aucun utilisateur ne correspond à ces filtres."
      />
    </div>
  );
}
