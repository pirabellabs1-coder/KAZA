"use client";

import { useState } from "react";
import { Mail, MoreVertical, Plus, Shield, UserCog, UserX } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/components/ui/toast-helper";
import { cn, getInitials } from "@/lib/utils";

export type StaffRole = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "SUPPORT";
export type StaffStatus = "active" | "inactive";

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
  jobTitle: string;
  lastLogin: string;
  status: StaffStatus;
  [key: string]: unknown;
}

const roleLabels: Record<StaffRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MODERATOR: "Modérateur",
  SUPPORT: "Support",
};

const roleBadgeClasses: Record<StaffRole, string> = {
  SUPER_ADMIN: "bg-kaza-navy text-white border-kaza-navy",
  ADMIN: "bg-kaza-blue/10 text-kaza-blue border-kaza-blue/20",
  MODERATOR: "bg-purple-100 text-purple-700 border-purple-200",
  SUPPORT: "bg-amber-100 text-amber-700 border-amber-200",
};

function formatRelativeLogin(iso: string): string {
  const date = new Date(iso);
  const now = new Date("2026-05-27T10:00:00Z");
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString("fr-FR");
}

interface StaffTableProps {
  rows: StaffMember[];
}

type DialogState =
  | { type: "invite" }
  | { type: "edit-role"; member: StaffMember }
  | { type: "deactivate"; member: StaffMember }
  | null;

export function StaffTable({ rows }: StaffTableProps) {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [newRole, setNewRole] = useState<StaffRole>("ADMIN");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("MODERATOR");

  const filtered = rows.filter((m) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Adresse email invalide");
      return;
    }
    toast.success(
      `Invitation envoyée à ${inviteEmail} (rôle : ${roleLabels[inviteRole]})`,
    );
    setInviteEmail("");
    setInviteRole("MODERATOR");
    setDialog(null);
  };

  const handleRoleChange = () => {
    if (!dialog || dialog.type !== "edit-role") return;
    toast.success(
      `Rôle de ${dialog.member.firstName} ${dialog.member.lastName} mis à jour vers ${roleLabels[newRole]}.`,
    );
    setDialog(null);
  };

  const handleDeactivate = () => {
    if (!dialog || dialog.type !== "deactivate") return;
    toast.success(
      `${dialog.member.firstName} ${dialog.member.lastName} a été désactivé.`,
    );
    setDialog(null);
  };

  const columns: DataTableColumn<StaffMember>[] = [
    {
      key: "member",
      label: "Membre",
      sortValue: (row) => `${row.lastName} ${row.firstName}`,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-kaza-navy/10 text-xs font-semibold text-kaza-navy">
              {getInitials(row.firstName, row.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {row.firstName} {row.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.jobTitle}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortValue: (row) => row.email,
      render: (row) => (
        <a
          href={`mailto:${row.email}`}
          className="inline-flex items-center gap-1.5 text-sm text-kaza-blue hover:underline"
        >
          <Mail className="size-3.5" />
          {row.email}
        </a>
      ),
    },
    {
      key: "role",
      label: "Rôle",
      sortValue: (row) => row.role,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            roleBadgeClasses[row.role],
          )}
        >
          <Shield className="size-3" />
          {roleLabels[row.role]}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: "Dernière connexion",
      sortValue: (row) => row.lastLogin,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatRelativeLogin(row.lastLogin)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortValue: (row) => row.status,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            row.status === "active"
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-600 border-gray-200",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              row.status === "active" ? "bg-green-500" : "bg-gray-400",
            )}
          />
          {row.status === "active" ? "Actif" : "Inactif"}
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
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setNewRole(row.role);
              setDialog({ type: "edit-role", member: row });
            }}
          >
            <UserCog className="size-4" />
            Modifier rôle
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-kaza-error hover:bg-red-50 hover:text-kaza-error"
            title="Désactiver"
            onClick={() => setDialog({ type: "deactivate", member: row })}
          >
            <UserX className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Plus d'options"
            onClick={() => toast.info("Plus d'options (démo)")}
          >
            <MoreVertical className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} membres dans l&apos;équipe
        </p>
        <Button onClick={() => setDialog({ type: "invite" })} className="gap-2">
          <Plus className="size-4" />
          Inviter un membre
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        searchAccessor={(row) =>
          `${row.firstName} ${row.lastName} ${row.email} ${row.jobTitle}`
        }
        searchPlaceholder="Rechercher par nom, email ou rôle..."
        filters={
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MODERATOR">Modérateur</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="Aucun membre"
        emptyDescription="Aucun membre ne correspond à ces filtres."
      />

      {/* Invite dialog */}
      <Dialog
        open={dialog?.type === "invite"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un nouveau membre</DialogTitle>
            <DialogDescription>
              Un email d&apos;invitation sera envoyé avec un lien de création de
              compte.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Adresse email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="prenom.nom@kaza.africa"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-role">Rôle assigné</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as StaffRole)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MODERATOR">Modérateur</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button onClick={handleInvite}>Envoyer l&apos;invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog
        open={dialog?.type === "edit-role"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              {dialog?.type === "edit-role" &&
                `${dialog.member.firstName} ${dialog.member.lastName} — ${dialog.member.email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-role">Nouveau rôle</Label>
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as StaffRole)}
            >
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MODERATOR">Modérateur</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button onClick={handleRoleChange}>Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate dialog */}
      <Dialog
        open={dialog?.type === "deactivate"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver ce membre ?</DialogTitle>
            <DialogDescription>
              {dialog?.type === "deactivate" &&
                `${dialog.member.firstName} ${dialog.member.lastName} ne pourra plus accéder à l'espace admin. Cette action est réversible.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Désactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
