"use client";

// =============================================================================
// KAZA — Actions client par membre : changer rôle / retirer
// =============================================================================

import { useState, useTransition } from "react";
import { MoreHorizontal, Loader2, UserX, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";

import { removeMember, updateMemberRole } from "@/actions/agency-team";
import type { AgencyRole } from "@/lib/queries/agency-team";

const ROLES = [
  { value: "DIRECTOR", label: "Directeur·rice" },
  { value: "MANAGER", label: "Manager" },
  { value: "AGENT_SENIOR", label: "Agent senior" },
  { value: "AGENT", label: "Agent" },
  { value: "INTERN", label: "Stagiaire" },
  { value: "ACCOUNTANT", label: "Comptable" },
] as const;

interface MemberActionsProps {
  memberId: string;
  memberName: string;
  currentRole: AgencyRole;
}

export function MemberActions({
  memberId,
  memberName,
  currentRole,
}: MemberActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [role, setRole] = useState<AgencyRole>(currentRole);
  const [pending, startTransition] = useTransition();

  const handleEdit = () => {
    startTransition(async () => {
      const res = await updateMemberRole(memberId, role);
      if (res.success) {
        toast.success("Rôle mis à jour");
        setEditOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const res = await removeMember(memberId);
      if (res.success) {
        toast.success(`${memberName} a été retiré de l'équipe`);
        setRemoveOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 px-2">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Modifier le rôle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setRemoveOpen(true)}
            className="text-rose-600 focus:text-rose-700"
          >
            <UserX className="mr-2 size-4" />
            Retirer du membre
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog modification rôle */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>{memberName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`edit-role-${memberId}`}>Nouveau rôle</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AgencyRole)}
            >
              <SelectTrigger id={`edit-role-${memberId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={pending}
              className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
            >
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmation suppression */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer ce membre ?</DialogTitle>
            <DialogDescription>
              {memberName} n&apos;aura plus accès à l&apos;espace agence.
              L&apos;historique est conservé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRemoveOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRemove}
              disabled={pending}
              variant="destructive"
            >
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
